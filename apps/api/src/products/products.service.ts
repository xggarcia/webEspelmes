import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toProductDetail, toProductSummary } from './products.mapper';

export type ProductListQuery = {
  page: number;
  pageSize: number;
  sort: 'new' | 'price_asc' | 'price_desc' | 'popular';
  categorySlug?: string;
  search?: string;
  customizableOnly?: boolean;
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: ProductListQuery) {
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(q.categorySlug ? { category: { slug: q.categorySlug } } : {}),
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search, mode: 'insensitive' } },
              { shortDescription: { contains: q.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(q.customizableOnly ? { isCustomizable: true } : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      q.sort === 'price_asc'
        ? { basePriceCents: 'asc' }
        : q.sort === 'price_desc'
          ? { basePriceCents: 'desc' }
          : { createdAt: 'desc' };

    const [total, products] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: { category: true },
      }),
    ]);

    return {
      page: q.page,
      pageSize: q.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
      items: products.map(toProductSummary),
    };
  }

  async bySlug(slug: string) {
    const p = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
        options: {
          orderBy: { sortOrder: 'asc' },
          include: { values: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    });
    if (!p || !p.isActive) {
      throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', message: 'Product not found' });
    }
    return toProductDetail(p);
  }
}
