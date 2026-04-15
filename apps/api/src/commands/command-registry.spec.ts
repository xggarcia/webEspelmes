import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { z } from 'zod';
import { CommandRegistry } from './command-registry';
import { BaseCommand } from './base.command';

class FakeCommand extends BaseCommand<{ multiplier: number }> {
  readonly name = 'recalculate-pricing' as const;
  readonly schema = z.object({ multiplier: z.number().positive() });
  readonly requiredRole = 'ADMIN' as any;
  execute = jest.fn(async (input) => ({
    affected: 3,
    summary: `ran with ${input.multiplier}`,
  }));
}

class ThrowingCommand extends BaseCommand {
  readonly name = 'bulk-inventory-update' as const;
  readonly schema = z.object({});
  readonly requiredRole = 'ADMIN' as any;
  execute = jest.fn(async () => {
    throw new BadRequestException({ code: 'BOOM', message: 'boom' });
  });
}

class StubBulk extends BaseCommand {
  readonly name = 'bulk-inventory-update' as const;
  readonly schema = z.object({});
  readonly requiredRole = 'ADMIN' as any;
  execute = jest.fn(async () => ({ affected: 0, summary: 'noop' }));
}

class StubBatch extends BaseCommand {
  readonly name = 'order-status-batch' as const;
  readonly schema = z.object({});
  readonly requiredRole = 'ADMIN' as any;
  execute = jest.fn(async () => ({ affected: 0, summary: 'noop' }));
}

function makeRegistry(opts: {
  recalc?: BaseCommand<any>;
  bulk?: BaseCommand<any>;
  batch?: BaseCommand<any>;
} = {}) {
  const prisma = {
    commandRun: { create: jest.fn(async ({ data }: any) => ({ id: 'run-1', ...data })) },
  };
  const audit = { record: jest.fn() };
  const registry = new CommandRegistry(
    prisma as any,
    audit as any,
    (opts.recalc ?? new FakeCommand()) as any,
    (opts.bulk ?? new StubBulk()) as any,
    (opts.batch ?? new StubBatch()) as any,
  );
  return { registry, prisma, audit };
}

describe('CommandRegistry.run', () => {
  it('executes the command, records a run row and writes an audit entry', async () => {
    const cmd = new FakeCommand();
    const { registry, prisma, audit } = makeRegistry({ recalc: cmd });
    const result = await registry.run(
      'recalculate-pricing',
      { multiplier: 1.1 },
      { actorId: 'u1', actorRole: 'ADMIN' as any, ip: '1.1.1.1' },
    );
    expect(result.success).toBe(true);
    expect(result.affected).toBe(3);
    expect(result.summary).toBe('ran with 1.1');
    expect(cmd.execute).toHaveBeenCalled();
    expect(prisma.commandRun.create).toHaveBeenCalled();
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'command.run', actorId: 'u1' }),
    );
  });

  it('throws NotFound for unknown command name', async () => {
    const { registry } = makeRegistry();
    await expect(
      registry.run('does-not-exist', {}, { actorId: 'u1', actorRole: 'ADMIN' as any }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws Forbidden when actor role does not match', async () => {
    const { registry } = makeRegistry();
    await expect(
      registry.run(
        'recalculate-pricing',
        { multiplier: 1 },
        { actorId: 'u1', actorRole: 'CUSTOMER' as any },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws BadRequest with details when input fails zod validation', async () => {
    const { registry } = makeRegistry();
    await expect(
      registry.run(
        'recalculate-pricing',
        { multiplier: -5 },
        { actorId: 'u1', actorRole: 'ADMIN' as any },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('records a failed run row and re-throws when handler throws', async () => {
    const cmd = new ThrowingCommand();
    const { registry, prisma, audit } = makeRegistry({ bulk: cmd });
    await expect(
      registry.run(
        'bulk-inventory-update',
        {},
        { actorId: 'u1', actorRole: 'ADMIN' as any },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    const createdWith = (prisma.commandRun.create as jest.Mock).mock.calls[0][0]
      .data;
    expect(createdWith.success).toBe(false);
    expect(createdWith.errorCode).toBe('BOOM');
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'command.run.failed' }),
    );
  });
});
