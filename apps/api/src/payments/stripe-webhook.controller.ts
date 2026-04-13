import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
  type RawBodyRequest,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type Stripe from 'stripe';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { StripeService } from './stripe.service';

@ApiTags('payments')
@Controller('payments/webhook')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly stripe: StripeService,
    private readonly orders: OrdersService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @HttpCode(200)
  @Post()
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException({ code: 'MISSING_SIGNATURE' });
    }
    const raw = req.rawBody;
    if (!raw) {
      throw new BadRequestException({ code: 'MISSING_RAW_BODY' });
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.constructEvent(raw, signature);
    } catch (err) {
      this.logger.warn(`stripe signature verify failed: ${(err as Error).message}`);
      throw new BadRequestException({ code: 'SIGNATURE_VERIFY_FAILED' });
    }

    // Idempotency: swallow repeats via unique event.id.
    try {
      await this.prisma.stripeEvent.create({
        data: { id: event.id, type: event.type, payload: event as unknown as object },
      });
    } catch {
      this.logger.log(`duplicate stripe event ${event.id}, ignoring`);
      return { received: true, duplicate: true };
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const orderId = pi.metadata?.orderId;
        if (!orderId) break;
        await this.prisma.payment.updateMany({
          where: { stripePaymentIntentId: pi.id },
          data: { status: 'SUCCEEDED', rawEvent: event as unknown as object },
        });
        const order = await this.orders.findById(orderId);
        if (order.status === 'PENDING') {
          await this.orders.transition(orderId, 'PAID');
          await this.orders.notifyStatusChange(orderId, 'PAID');
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.prisma.payment.updateMany({
          where: { stripePaymentIntentId: pi.id },
          data: { status: 'FAILED', rawEvent: event as unknown as object },
        });
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const pi = charge.payment_intent;
        if (typeof pi === 'string') {
          const payment = await this.prisma.payment.findFirst({
            where: { stripePaymentIntentId: pi },
          });
          if (payment) {
            await this.prisma.payment.update({
              where: { id: payment.id },
              data: { status: 'REFUNDED', rawEvent: event as unknown as object },
            });
            const order = await this.orders.findById(payment.orderId);
            if (order.status !== 'REFUNDED' && order.status !== 'CANCELLED') {
              await this.orders.transition(payment.orderId, 'REFUNDED');
            }
          }
        }
        break;
      }
      default:
        this.logger.debug(`unhandled stripe event: ${event.type}`);
    }

    return { received: true };
  }
}
