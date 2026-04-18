import {
  Body,
  Controller,
  Headers,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, type RequestUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { OrdersService } from '../orders/orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { CartService } from '../cart/cart.service';
import { StartCheckoutSchema, type StartCheckoutDto } from '../orders/orders.dto';
import { StripeService } from './stripe.service';

const CART_COOKIE = 'cart_token';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly stripe: StripeService,
    private readonly orders: OrdersService,
    private readonly prisma: PrismaService,
    private readonly cart: CartService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('checkout')
  async startCheckout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: RequestUser | undefined,
    @Headers('x-cart-token') cartHeader: string | undefined,
    @Body(new ZodValidationPipe(StartCheckoutSchema)) dto: StartCheckoutDto,
  ) {
    const anonToken =
      cartHeader?.trim() ||
      (req.cookies as Record<string, string> | undefined)?.['cart_token'];
    const cart = user
      ? await this.prisma.cart.findUnique({ where: { userId: user.id } })
      : anonToken
        ? await this.prisma.cart.findUnique({ where: { anonToken } })
        : null;
    if (!cart) {
      throw new Error('CART_NOT_FOUND');
    }

    const order = await this.orders.createFromCart({
      ...(user ? { userId: user.id } : {}),
      email: dto.email,
      cartId: cart.id,
      shipping: dto.shipping,
      ...(dto.billing ? { billing: dto.billing } : {}),
      ...(dto.notes ? { notes: dto.notes } : {}),
    });

    // Clear cart after order is placed
    const cartCtx = user ? { userId: user.id } : { anonToken };
    await this.cart.clear(cartCtx);
    if (!user && anonToken) {
      res.clearCookie(CART_COOKIE, { path: '/' });
    }

    if (!this.stripe.isConfigured()) {
      return {
        orderId: order.id,
        orderNumber: order.number,
        totalCents: order.totalCents,
        clientSecret: null,
        stripeConfigured: false,
        note: 'Stripe not configured — order created in PENDING state for dev.',
      };
    }

    const intent = await this.stripe.createPaymentIntent({
      amountCents: order.totalCents,
      orderId: order.id,
      orderNumber: order.number,
      email: dto.email,
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: intent.id },
    });
    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        provider: 'stripe',
        stripePaymentIntentId: intent.id,
        status: 'REQUIRES_PAYMENT',
        amountCents: order.totalCents,
      },
    });

    return {
      orderId: order.id,
      orderNumber: order.number,
      totalCents: order.totalCents,
      clientSecret: intent.clientSecret,
      stripeConfigured: true,
    };
  }

  /**
   * Dev-only: simulate payment success without hitting Stripe. Active only
   * when Stripe is NOT configured (placeholder key).
   */
  @Public()
  @Post('dev/mark-paid/:orderId')
  async devMarkPaid(@Param('orderId') orderId: string, @Res() res: Response) {
    if (this.stripe.isConfigured()) {
      res.status(403).json({ code: 'STRIPE_ACTIVE', message: 'Use real Stripe flow.' });
      return;
    }
    const updated = await this.orders.transition(orderId, 'PAID');
    await this.orders.notifyStatusChange(updated.id, 'PAID');
    res.json(updated);
  }
}
