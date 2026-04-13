import { Injectable, ConflictException } from '@nestjs/common';
import type { Prisma, StockMovementKind } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * InventoryService centralises stock reads and writes.
 * Transactional: all mutations go through a StockMovement record so we
 * keep a full audit of why stock changed (purchase, refund, restock, admin adjustment).
 */
@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async adjust(
    productId: string,
    delta: number,
    kind: StockMovementKind,
    reason: string,
    actorId?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    const product = await client.product.findUnique({ where: { id: productId } });
    if (!product) throw new ConflictException({ code: 'PRODUCT_NOT_FOUND' });
    const next = product.stock + delta;
    if (next < 0) {
      throw new ConflictException({
        code: 'INSUFFICIENT_STOCK',
        message: `Not enough stock for "${product.name}"`,
      });
    }
    await client.product.update({ where: { id: productId }, data: { stock: next } });
    await client.stockMovement.create({
      data: { productId, delta, kind, reason, ...(actorId ? { createdBy: actorId } : {}) },
    });
  }

  async checkAvailability(productId: string, quantity: number): Promise<boolean> {
    const p = await this.prisma.product.findUnique({ where: { id: productId } });
    return !!p && p.stock >= quantity;
  }
}
