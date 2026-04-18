import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  ALLOWED_TRANSITIONS,
  type Address,
  type OrderStatus,
} from '@espelmes/shared';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { MailerService } from '../mailer/mailer.service';
import { generateOrderNumber } from './order-number';

export type CreateOrderInput = {
  userId?: string;
  email: string;
  cartId: string;
  shipping: Address;
  billing?: Address;
  notes?: string;
};

export type OrderTotals = {
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly shopEmail: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly mailer: MailerService,
    config: ConfigService,
  ) {
    this.shopEmail = config.get<string>('CONTACT_EMAIL') ?? config.get<string>('ADMIN_EMAIL') ?? '';
  }

  /**
   * Create a PENDING order from the current cart contents. Uses a transaction
   * so subtotal, tax, shipping and line items are committed atomically. Stock
   * is NOT decremented here — that happens when payment succeeds.
   */
  async createFromCart(input: CreateOrderInput) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: input.cartId },
      include: { items: { include: { product: true } } },
    });
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException({ code: 'CART_EMPTY', message: 'Cart is empty' });
    }

    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        throw new ConflictException({
          code: 'INSUFFICIENT_STOCK',
          message: `Only ${item.product.stock} of "${item.product.name}" in stock`,
        });
      }
    }

    const subtotalCents = cart.items.reduce(
      (s, i) => s + i.unitPriceCents * i.quantity,
      0,
    );

    const shippingZone = await this.resolveShipping(input.shipping);
    const shippingCents = shippingZone?.priceCents ?? 0;

    // VAT is already included in product prices (Spain retail convention);
    // we report it as an informational breakdown, not an add-on.
    const weightedVat =
      cart.items.reduce(
        (s, i) => s + i.unitPriceCents * i.quantity * i.product.vatRate,
        0,
      ) / Math.max(1, subtotalCents);
    const taxCents = Math.round((subtotalCents * weightedVat) / (1 + weightedVat));
    const totalCents = subtotalCents + shippingCents;

    const order = await this.prisma.order.create({
      data: {
        number: generateOrderNumber(),
        userId: input.userId,
        email: input.email,
        status: 'PENDING',
        subtotalCents,
        shippingCents,
        taxCents,
        totalCents,
        shippingAddress: input.shipping as unknown as Prisma.InputJsonValue,
        ...(input.billing
          ? { billingAddress: input.billing as unknown as Prisma.InputJsonValue }
          : {}),
        ...(input.notes ? { notes: input.notes } : {}),
        items: {
          create: cart.items.map((i) => ({
            productId: i.productId,
            name: i.product.name,
            quantity: i.quantity,
            unitPriceCents: i.unitPriceCents,
            ...(i.customization !== null
              ? { customization: i.customization as Prisma.InputJsonValue }
              : {}),
          })),
        },
      },
      include: { items: true },
    });

    return order;
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true, payments: true },
    });
    if (!order) throw new NotFoundException({ code: 'ORDER_NOT_FOUND' });
    return order;
  }

  async findByNumber(number: string) {
    const order = await this.prisma.order.findUnique({
      where: { number },
      include: { items: true, payments: true },
    });
    if (!order) throw new NotFoundException({ code: 'ORDER_NOT_FOUND' });
    return order;
  }

  async listForUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  /**
   * Transition an order's status with enforcement of the state machine from
   * @espelmes/shared. On PAID we decrement stock and email the customer; on
   * CANCELLED / REFUNDED after PAID we return stock.
   */
  async transition(
    id: string,
    to: OrderStatus,
    opts: { actorId?: string; reason?: string } = {},
  ) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!order) throw new NotFoundException({ code: 'ORDER_NOT_FOUND' });
      const allowed = ALLOWED_TRANSITIONS[order.status as OrderStatus];
      if (!allowed.includes(to)) {
        throw new BadRequestException({
          code: 'INVALID_TRANSITION',
          message: `Cannot transition ${order.status} → ${to}`,
        });
      }

      const wasPaid = order.status !== 'PENDING';
      const becomingPaid = to === 'PAID' && order.status === 'PENDING';
      const releasingStock =
        wasPaid && (to === 'CANCELLED' || to === 'REFUNDED');

      if (becomingPaid) {
        for (const item of order.items) {
          await this.inventory.adjust(
            item.productId,
            -item.quantity,
            'PURCHASE',
            `order:${order.number}`,
            opts.actorId,
            tx,
          );
        }
      } else if (releasingStock) {
        for (const item of order.items) {
          await this.inventory.adjust(
            item.productId,
            item.quantity,
            'REFUND',
            `order:${order.number}:${to.toLowerCase()}`,
            opts.actorId,
            tx,
          );
        }
      }

      const updated = await tx.order.update({
        where: { id },
        data: { status: to },
        include: { items: true, payments: true },
      });

      this.logger.log(`order ${order.number}: ${order.status} → ${to}`);
      return updated;
    });
  }

  async notifyStatusChange(orderId: string, status: OrderStatus): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) return;
    const template =
      status === 'PAID'
        ? 'order.confirmation'
        : status === 'SHIPPED'
          ? 'order.shipped'
          : status === 'CANCELLED'
            ? 'order.cancelled'
            : null;
    if (!template) return;

    const subject =
      status === 'PAID'
        ? `Comanda confirmada — ${order.number}`
        : status === 'SHIPPED'
          ? `La teva comanda ${order.number} és en camí!`
          : `Comanda cancel·lada — ${order.number}`;

    const data = {
      orderNumber: order.number,
      totalCents: order.totalCents,
      subtotalCents: order.subtotalCents,
      shippingCents: order.shippingCents,
      items: order.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCents,
      })),
    };

    // Customer notification
    try {
      await this.mailer.send({ to: order.email, subject: `Espelmes — ${subject}`, template, data });
    } catch (e) {
      this.logger.error(`[orders] Failed to send customer email for order ${order.number}: ${e}`);
    }

    // Shop owner notification on new paid orders
    if (status === 'PAID' && this.shopEmail) {
      const addr = order.shippingAddress as Record<string, string> | null;
      const shippingAddress = addr
        ? [addr['fullName'], addr['street'], `${addr['postalCode']} ${addr['city']}`, addr['country']]
            .filter(Boolean)
            .join(', ')
        : null;
      try {
        await this.mailer.send({
          to: this.shopEmail,
          subject: `Nova comanda — ${order.number} (${(order.totalCents / 100).toFixed(2)} €)`,
          template: 'order.new-notification',
          data: { ...data, customerEmail: order.email, shippingAddress },
        });
      } catch (e) {
        this.logger.error(`[orders] Failed to send shop email for order ${order.number}: ${e}`);
      }
    }
  }

  async getShippingEstimate(postalCode: string): Promise<{ shippingCents: number }> {
    const zone = await this.resolveShipping({ postalCode } as Address);
    return { shippingCents: zone?.priceCents ?? 0 };
  }

  private async resolveShipping(address: Address) {
    // naive mapping: islands/Canaries → different zones, else peninsular
    const postal = address.postalCode;
    const code = postal.startsWith('07')
      ? 'ES_BAL'
      : postal.startsWith('35') || postal.startsWith('38')
        ? 'ES_CAN'
        : 'ES_PEN';
    return this.prisma.shippingZone.findUnique({ where: { code } });
  }
}
