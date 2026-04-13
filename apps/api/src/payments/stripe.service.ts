import { Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export const STRIPE_CLIENT = 'STRIPE_CLIENT';

export const stripeClientProvider = {
  provide: STRIPE_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): Stripe | null => {
    const key = config.get<string>('STRIPE_SECRET_KEY');
    if (!key || key.includes('replace_me') || key.includes('placeholder')) {
      return null;
    }
    return new Stripe(key, { apiVersion: '2024-10-28.acacia' as unknown as Stripe.LatestApiVersion });
  },
};

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);

  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe | null,
    private readonly config: ConfigService,
  ) {}

  isConfigured(): boolean {
    return this.stripe !== null;
  }

  client(): Stripe {
    if (!this.stripe) {
      throw new ServiceUnavailableException({
        code: 'STRIPE_NOT_CONFIGURED',
        message: 'Stripe keys are not set. Use test mode for dev.',
      });
    }
    return this.stripe;
  }

  async createPaymentIntent(params: {
    amountCents: number;
    orderId: string;
    orderNumber: string;
    email: string;
  }): Promise<{ id: string; clientSecret: string }> {
    const intent = await this.client().paymentIntents.create({
      amount: params.amountCents,
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      receipt_email: params.email,
      metadata: {
        orderId: params.orderId,
        orderNumber: params.orderNumber,
      },
    });
    return { id: intent.id, clientSecret: intent.client_secret ?? '' };
  }

  constructEvent(rawBody: Buffer, signature: string): Stripe.Event {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret) {
      throw new ServiceUnavailableException({
        code: 'STRIPE_WEBHOOK_SECRET_MISSING',
      });
    }
    return this.client().webhooks.constructEvent(rawBody, signature, secret);
  }
}
