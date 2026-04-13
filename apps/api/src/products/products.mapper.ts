import type {
  Product,
  ProductImage,
  ProductOption,
  ProductOptionValue,
  Category,
} from '@prisma/client';

type ProductWithRelations = Product & {
  category: Category;
  images?: ProductImage[];
  options?: (ProductOption & { values: ProductOptionValue[] })[];
};

export function toProductSummary(p: ProductWithRelations) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription || null,
    basePriceCents: p.basePriceCents,
    currency: 'EUR' as const,
    heroImageUrl: p.heroImageUrl,
    categorySlug: p.category.slug,
    isCustomizable: p.isCustomizable,
    inStock: p.stock > 0,
  };
}

export function toProductDetail(p: ProductWithRelations) {
  return {
    ...toProductSummary(p),
    description: p.description,
    images: (p.images ?? []).map((img) => ({ url: img.url, alt: img.alt })),
    vatRate: p.vatRate,
    stock: p.stock,
    options: (p.options ?? []).map((o) => ({
      id: o.id,
      kind: o.kind,
      label: o.label,
      required: o.required,
      values: o.values.map((v) => ({
        id: v.id,
        code: v.code,
        label: v.label,
        priceDeltaCents: v.priceDeltaCents,
        meta: (v.meta as Record<string, unknown>) ?? undefined,
      })),
    })),
  };
}
