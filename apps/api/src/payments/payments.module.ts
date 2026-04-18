import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersModule } from '../orders/orders.module';
import { CartModule } from '../cart/cart.module';
import { StripeService, stripeClientProvider } from './stripe.service';
import { PaymentsController } from './payments.controller';
import { StripeWebhookController } from './stripe-webhook.controller';

@Module({
  imports: [PrismaModule, OrdersModule, CartModule],
  controllers: [PaymentsController, StripeWebhookController],
  providers: [stripeClientProvider, StripeService],
  exports: [StripeService],
})
export class PaymentsModule {}
