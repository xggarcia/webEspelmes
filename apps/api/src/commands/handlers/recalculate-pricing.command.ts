import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  RecalculatePricingInputSchema,
  type RecalculatePricingInput,
} from '@espelmes/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseCommand, type CommandContext, type CommandOutput } from '../base.command';

@Injectable()
export class RecalculatePricingCommand extends BaseCommand<RecalculatePricingInput> {
  readonly name = 'recalculate-pricing' as const;
  readonly schema = RecalculatePricingInputSchema;
  readonly requiredRole = Role.ADMIN;

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async execute(
    input: RecalculatePricingInput,
    _ctx: CommandContext,
  ): Promise<CommandOutput> {
    const where = input.categoryId ? { categoryId: input.categoryId } : {};
    const products = await this.prisma.product.findMany({ where });

    const round = (cents: number): number => {
      const step = input.roundToCents;
      return Math.round((cents * input.multiplier) / step) * step;
    };

    const changes = products
      .map((p) => ({
        id: p.id,
        name: p.name,
        from: p.basePriceCents,
        to: round(p.basePriceCents),
      }))
      .filter((c) => c.to !== c.from);

    if (!input.dryRun && changes.length > 0) {
      await this.prisma.$transaction(
        changes.map((c) =>
          this.prisma.product.update({
            where: { id: c.id },
            data: { basePriceCents: c.to },
          }),
        ),
      );
    }

    return {
      affected: changes.length,
      summary: `${input.dryRun ? '[dry-run] ' : ''}Repriced ${changes.length} of ${products.length} products (x${input.multiplier}).`,
      details: { changes: changes.slice(0, 20) },
      dryRun: input.dryRun,
    };
  }
}
