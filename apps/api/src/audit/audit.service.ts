import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type AuditEntry = {
  action: string;
  actorId?: string;
  target?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: entry.action,
          ...(entry.actorId ? { actorId: entry.actorId } : {}),
          ...(entry.target ? { target: entry.target } : {}),
          ...(entry.metadata
            ? { metadata: entry.metadata as Prisma.InputJsonValue }
            : {}),
          ...(entry.ip ? { ip: entry.ip } : {}),
          ...(entry.userAgent ? { userAgent: entry.userAgent } : {}),
        },
      });
    } catch (err) {
      this.logger.warn(`audit write failed: ${(err as Error).message}`);
    }
  }

  list(params: { limit?: number; action?: string; actorId?: string } = {}) {
    return this.prisma.auditLog.findMany({
      where: {
        ...(params.action ? { action: params.action } : {}),
        ...(params.actorId ? { actorId: params.actorId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(params.limit ?? 100, 500),
      include: { actor: { select: { id: true, email: true, name: true } } },
    });
  }
}
