import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersModule } from '../orders/orders.module';
import { StripeService, stripeClientProvider } from './stripe.service';
import { PaymentsController } from './payments.controller';
import { StripeWebhookController } from './stripe-webhook.controller';

@Module({
  imports: [PrismaModule, OrdersModule],
  controllers: [PaymentsController, StripeWebhookController],
  providers: [stripeClientProvider, StripeService],
  exports: [StripeService],
})
export class PaymentsModule {}
