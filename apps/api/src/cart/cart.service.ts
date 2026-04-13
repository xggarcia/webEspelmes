import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { Cart, CartItem, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConfiguratorService } from '../configurator/configurator.service';
import { PricingEngine } from '../configurator/pricing.engine';
import type { AddCartItemDto, UpdateCartItemDto } from './cart.dto';

export type CartContext = { userId?: string; anonToken?: string };

type CartWithItems = Cart & { items: CartItem[] };

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configurator: ConfiguratorService,
    private readonly pricing: PricingEngine,
  ) {}

  async getOrCreate(ctx: CartContext): Promise<{ cart: CartWithItems; anonToken?: string }> {
    if (ctx.userId) {
      const existing = await this.prisma.cart.findUnique({
        where: { userId: ctx.userId },
        include: { items: true },
      });
      if (existing) return { cart: existing };
      const created = await this.prisma.cart.create({
        data: { userId: ctx.userId },
        include: { items: true },
      });
      return { cart: created };
    }
    if (ctx.anonToken) {
      const existing = await this.prisma.cart.findUnique({
        where: { anonToken: ctx.anonToken },
        include: { items: true },
      });
      if (existing) return { cart: existing };
    }
    const token = randomBytes(24).toString('hex');
    const created = await this.prisma.cart.create({
      data: { anonToken: token },
      include: { items: true },
    });
    return { cart: created, anonToken: token };
  }

  async snapshot(ctx: CartContext) {
    const { cart, anonToken } = await this.getOrCreate(ctx);
    return { ...(await this.summarise(cart)), anonToken };
  }

  async addItem(ctx: CartContext, dto: AddCartItemDto) {
    const { cart, anonToken } = await this.getOrCreate(ctx);
    const product = await this.configurator.loadProduct(dto.productId);

    let unitPriceCents = product.basePriceCents;
    let customization: Prisma.InputJsonValue | undefined;
    if (dto.customization) {
      const pricing = this.pricing.compute(product, dto.customization);
      unitPriceCents = pricing.unitCents;
      customization = dto.customization as unknown as Prisma.InputJsonValue;
    }

    if (product.stock < dto.quantity) {
      throw new ConflictException({
        code: 'INSUFFICIENT_STOCK',
        message: `Only ${product.stock} of "${product.name}" in stock`,
      });
    }

    await this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        quantity: dto.quantity,
        unitPriceCents,
        ...(customization !== undefined ? { customization } : {}),
      },
    });

    const refreshed = await this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: true },
    });
    return { ...(await this.summarise(refreshed!)), anonToken };
  }

  async updateItem(ctx: CartContext, itemId: string, dto: UpdateCartItemDto) {
    const { cart } = await this.getOrCreate(ctx);
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException({ code: 'CART_ITEM_NOT_FOUND' });
    const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
    if (!product) throw new BadRequestException({ code: 'PRODUCT_MISSING' });
    if (product.stock < dto.quantity) {
      throw new ConflictException({
        code: 'INSUFFICIENT_STOCK',
        message: `Only ${product.stock} of "${product.name}" in stock`,
      });
    }
    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });
    const refreshed = await this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: true },
    });
    return await this.summarise(refreshed!);
  }

  async removeItem(ctx: CartContext, itemId: string) {
    const { cart } = await this.getOrCreate(ctx);
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException({ code: 'CART_ITEM_NOT_FOUND' });
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    const refreshed = await this.prisma.cart.findUnique({
      where: { id: cart.id },
      include: { items: true },
    });
    return await this.summarise(refreshed!);
  }

  async clear(ctx: CartContext) {
    const { cart } = await this.getOrCreate(ctx);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return await this.summarise({ ...cart, items: [] });
  }

  /** Merge an anon cart into the user cart after login. */
  async merge(userId: string, anonToken: string): Promise<void> {
    if (!anonToken) return;
    const anon = await this.prisma.cart.findUnique({
      where: { anonToken },
      include: { items: true },
    });
    if (!anon || anon.items.length === 0) return;
    const { cart: userCart } = await this.getOrCreate({ userId });
    await this.prisma.$transaction([
      this.prisma.cartItem.updateMany({
        where: { cartId: anon.id },
        data: { cartId: userCart.id },
      }),
      this.prisma.cart.delete({ where: { id: anon.id } }),
    ]);
  }

  private async summariseWithProducts(cart: CartWithItems) {
    const productIds = Array.from(new Set(cart.items.map((i) => i.productId)));
    const products = productIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, slug: true },
        })
      : [];
    const byId = new Map(products.map((p) => [p.id, p]));
    const subtotalCents = cart.items.reduce(
      (s, i) => s + i.unitPriceCents * i.quantity,
      0,
    );
    return {
      id: cart.id,
      items: cart.items.map((i) => {
        const p = byId.get(i.productId);
        return {
          id: i.id,
          productId: i.productId,
          productName: p?.name ?? '',
          productSlug: p?.slug ?? '',
          quantity: i.quantity,
          unitPriceCents: i.unitPriceCents,
          lineTotalCents: i.unitPriceCents * i.quantity,
          customization: i.customization,
        };
      }),
      itemCount: cart.items.reduce((s, i) => s + i.quantity, 0),
      subtotalCents,
      currency: 'EUR' as const,
    };
  }

  private summarise(cart: CartWithItems) {
    return this.summariseWithProducts(cart);
  }
}
