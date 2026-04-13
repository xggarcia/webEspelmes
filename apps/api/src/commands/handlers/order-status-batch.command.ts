import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  OrderStatusBatchInputSchema,
  type OrderStatusBatchInput,
} from '@espelmes/shared';
import { OrdersService } from '../../orders/orders.service';
import { BaseCommand, type CommandContext, type CommandOutput } from '../base.command';

@Injectable()
export class OrderStatusBatchCommand extends BaseCommand<OrderStatusBatchInput> {
  readonly name = 'order-status-batch' as const;
  readonly schema = OrderStatusBatchInputSchema;
  readonly requiredRole = Role.ADMIN;

  constructor(private readonly orders: OrdersService) {
    super();
  }

  async execute(
    input: OrderStatusBatchInput,
    ctx: CommandContext,
  ): Promise<CommandOutput> {
    const errors: { code: string; message: string; context?: unknown }[] = [];
    let applied = 0;

    for (const id of input.orderIds) {
      try {
        await this.orders.transition(id, input.targetStatus, {
          actorId: ctx.actorId,
          ...(input.note ? { reason: input.note } : {}),
        });
        await this.orders.notifyStatusChange(id, input.targetStatus);
        applied += 1;
      } catch (err) {
        const e = err as { response?: { code?: string; message?: string } };
        errors.push({
          code: e?.response?.code ?? 'TRANSITION_FAILED',
          message: e?.response?.message ?? (err as Error).message,
          context: { orderId: id },
        });
      }
    }

    return {
      affected: applied,
      summary: `Transitioned ${applied} of ${input.orderIds.length} orders → ${input.targetStatus}.`,
      details: { errors },
    };
  }
}
