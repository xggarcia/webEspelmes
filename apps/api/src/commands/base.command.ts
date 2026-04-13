import type { Role } from '@prisma/client';
import type { ZodType, ZodTypeDef } from 'zod';
import type { CommandName } from '@espelmes/shared';

export type CommandContext = {
  actorId: string;
  actorRole: Role;
  ip?: string;
  userAgent?: string;
};

export type CommandOutput = {
  affected: number;
  summary: string;
  details?: Record<string, unknown>;
  dryRun?: boolean;
};

/**
 * Every admin command extends BaseCommand. The registry handles zod
 * validation, role enforcement, timing, audit logging and error shaping,
 * so handlers stay focused on the actual business change.
 */
export abstract class BaseCommand<I = unknown> {
  abstract readonly name: CommandName;
  // 3-arg ZodType allows schemas with `.default()` whose input type differs from output.
  abstract readonly schema: ZodType<I, ZodTypeDef, unknown>;
  abstract readonly requiredRole: Role;
  abstract execute(input: I, ctx: CommandContext): Promise<CommandOutput>;
}
