import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { CommandName, CommandResult } from '@espelmes/shared';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { BaseCommand, type CommandContext } from './base.command';
import { RecalculatePricingCommand } from './handlers/recalculate-pricing.command';
import { BulkInventoryUpdateCommand } from './handlers/bulk-inventory-update.command';
import { OrderStatusBatchCommand } from './handlers/order-status-batch.command';

@Injectable()
export class CommandRegistry {
  private readonly logger = new Logger(CommandRegistry.name);
  private readonly handlers = new Map<CommandName, BaseCommand<unknown>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    recalcPricing: RecalculatePricingCommand,
    bulkInventory: BulkInventoryUpdateCommand,
    orderBatch: OrderStatusBatchCommand,
  ) {
    this.register(recalcPricing);
    this.register(bulkInventory);
    this.register(orderBatch);
  }

  private register<I>(cmd: BaseCommand<I>): void {
    this.handlers.set(cmd.name, cmd as BaseCommand<unknown>);
  }

  listNames(): CommandName[] {
    return Array.from(this.handlers.keys());
  }

  async run(
    name: string,
    rawInput: unknown,
    ctx: CommandContext,
  ): Promise<CommandResult> {
    const cmd = this.handlers.get(name as CommandName);
    if (!cmd) {
      throw new NotFoundException({
        code: 'COMMAND_NOT_FOUND',
        message: `Unknown command "${name}"`,
      });
    }
    if (ctx.actorRole !== cmd.requiredRole) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: `Command "${name}" requires role ${cmd.requiredRole}`,
      });
    }

    const parsed = cmd.schema.safeParse(rawInput);
    if (!parsed.success) {
      throw new BadRequestException({
        code: 'COMMAND_INPUT_INVALID',
        message: 'Invalid command input',
        details: parsed.error.flatten(),
      });
    }

    const start = Date.now();
    try {
      const out = await cmd.execute(parsed.data, ctx);
      const durationMs = Date.now() - start;

      const run = await this.prisma.commandRun.create({
        data: {
          name: cmd.name,
          actorId: ctx.actorId,
          input: parsed.data as object,
          result: out as unknown as object,
          success: true,
          durationMs,
          affected: out.affected,
        },
      });

      await this.audit.record({
        action: 'command.run',
        actorId: ctx.actorId,
        target: cmd.name,
        metadata: { runId: run.id, affected: out.affected, dryRun: out.dryRun ?? false },
        ...(ctx.ip ? { ip: ctx.ip } : {}),
        ...(ctx.userAgent ? { userAgent: ctx.userAgent } : {}),
      });

      return {
        name: cmd.name,
        success: true,
        durationMs,
        affected: out.affected,
        summary: out.summary,
        dryRun: out.dryRun ?? false,
        errors: Array.isArray((out.details as { errors?: unknown[] })?.errors)
          ? ((out.details as { errors: { code: string; message: string; context?: unknown }[] }).errors)
          : [],
      };
    } catch (err) {
      const durationMs = Date.now() - start;
      const e = err as {
        response?: { code?: string; message?: string };
        message?: string;
      };
      const errorCode = e?.response?.code ?? 'COMMAND_ERROR';
      const errorMsg = e?.response?.message ?? e?.message ?? 'Command failed';

      await this.prisma.commandRun.create({
        data: {
          name: cmd.name,
          actorId: ctx.actorId,
          input: parsed.data as object,
          success: false,
          durationMs,
          affected: 0,
          errorCode,
          errorMsg,
        },
      });
      await this.audit.record({
        action: 'command.run.failed',
        actorId: ctx.actorId,
        target: cmd.name,
        metadata: { errorCode, errorMsg },
      });
      this.logger.warn(`command "${cmd.name}" failed: ${errorMsg}`);
      throw err;
    }
  }
}
