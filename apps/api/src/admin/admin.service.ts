import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      productCount,
      activeProductCount,
      customerCount,
      openOrderCount,
      revenueAgg,
      last30Orders,
      lowStock,
    ] = await this.prisma.$transaction([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.order.count({
        where: { status: { in: ['PAID', 'FULFILLED', 'SHIPPED'] } },
      }),
      this.prisma.order.aggregate({
        where: { status: { in: ['PAID', 'FULFILLED', 'SHIPPED', 'DELIVERED'] } },
        _sum: { totalCents: true },
        _count: true,
      }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: since30 },
          status: { in: ['PAID', 'FULFILLED', 'SHIPPED', 'DELIVERED'] },
        },
      }),
      this.prisma.product.findMany({
        where: { isActive: true, stock: { lte: 5 } },
        select: { id: true, name: true, stock: true, slug: true },
        orderBy: { stock: 'asc' },
        take: 10,
      }),
    ]);

    return {
      counts: {
        products: productCount,
        activeProducts: activeProductCount,
        customers: customerCount,
        openOrders: openOrderCount,
      },
      revenue: {
        lifetimeCents: revenueAgg._sum.totalCents ?? 0,
        lifetimeOrders: revenueAgg._count,
        last30dOrders: last30Orders,
      },
      lowStock,
    };
  }

  recentOrders(limit = 20) {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      include: { items: true },
    });
  }

  listCustomers(limit = 50) {
    return this.prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    });
  }
}
