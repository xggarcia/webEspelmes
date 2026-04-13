import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersModule } from '../orders/orders.module';
import { CommandsController } from './commands.controller';
import { CommandRegistry } from './command-registry';
import { RecalculatePricingCommand } from './handlers/recalculate-pricing.command';
import { BulkInventoryUpdateCommand } from './handlers/bulk-inventory-update.command';
import { OrderStatusBatchCommand } from './handlers/order-status-batch.command';

@Module({
  imports: [PrismaModule, OrdersModule],
  controllers: [CommandsController],
  providers: [
    CommandRegistry,
    RecalculatePricingCommand,
    BulkInventoryUpdateCommand,
    OrderStatusBatchCommand,
  ],
  exports: [CommandRegistry],
})
export class CommandsModule {}
