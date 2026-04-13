import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  BulkInventoryUpdateInputSchema,
  type BulkInventoryUpdateInput,
} from '@espelmes/shared';
import { InventoryService } from '../../inventory/inventory.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseCommand, type CommandContext, type CommandOutput } from '../base.command';

@Injectable()
export class BulkInventoryUpdateCommand extends BaseCommand<BulkInventoryUpdateInput> {
  readonly name = 'bulk-inventory-update' as const;
  readonly schema = BulkInventoryUpdateInputSchema;
  readonly requiredRole = Role.ADMIN;

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
  ) {
    super();
  }

  async execute(
    input: BulkInventoryUpdateInput,
    ctx: CommandContext,
  ): Promise<CommandOutput> {
    const errors: { code: string; message: string; context?: unknown }[] = [];
    let applied = 0;

    if (input.dryRun) {
      const ids = input.updates.map((u) => u.productId);
      const found = await this.prisma.product.findMany({
        where: { id: { in: ids } },
        select: { id: true, stock: true, name: true },
      });
      const byId = new Map(found.map((p) => [p.id, p]));
      for (const u of input.updates) {
        const p = byId.get(u.productId);
        if (!p) {
          errors.push({ code: 'NOT_FOUND', message: 'Product missing', context: u });
          continue;
        }
        if (p.stock + u.stockDelta < 0) {
          errors.push({
            code: 'INSUFFICIENT_STOCK',
            message: `Would set "${p.name}" below zero`,
            context: u,
          });
          continue;
        }
        applied += 1;
      }
      return {
        affected: applied,
        summary: `[dry-run] Would apply ${applied} updates, ${errors.length} issues.`,
        details: { errors },
        dryRun: true,
      };
    }

    await this.prisma.$transaction(async (tx) => {
      for (const u of input.updates) {
        try {
          await this.inventory.adjust(
            u.productId,
            u.stockDelta,
            'ADJUSTMENT',
            u.reason,
            ctx.actorId,
            tx,
          );
          applied += 1;
        } catch (err) {
          const e = err as { response?: { code?: string; message?: string } };
          errors.push({
            code: e?.response?.code ?? 'ADJUST_FAILED',
            message: e?.response?.message ?? (err as Error).message,
            context: u,
          });
        }
      }
    });

    return {
      affected: applied,
      summary: `Applied ${applied} of ${input.updates.length} adjustments (${errors.length} failed).`,
      details: { errors },
    };
  }
}
