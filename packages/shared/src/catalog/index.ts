import { z } from 'zod';

export const CandleShapeSchema = z.enum([
  'pillar',
  'taper',
  'votive',
  'container',
  'heart',
  'sphere',
]);
export type CandleShape = z.infer<typeof CandleShapeSchema>;

export const CandleFinishSchema = z.enum(['matte', 'glossy', 'pearl', 'textured']);
export type CandleFinish = z.infer<typeof CandleFinishSchema>;

export const PlatformSchema = z.enum(['none', 'wood', 'ceramic', 'metal']);
export type PlatformType = z.infer<typeof PlatformSchema>;

export const ProductOptionKindSchema = z.enum([
  'color',
  'size',
  'finish',
  'shape',
  'platform',
  'label',
  'accessory',
]);
export type ProductOptionKind = z.infer<typeof ProductOptionKindSchema>;

export const ProductSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  shortDescription: z.string().nullable(),
  basePriceCents: z.number().int().nonnegative(),
  currency: z.literal('EUR'),
  heroImageUrl: z.string().url().nullable(),
  categorySlug: z.string(),
  isCustomizable: z.boolean(),
  inStock: z.boolean(),
});
export type ProductSummary = z.infer<typeof ProductSummarySchema>;

export const ProductOptionValueSchema = z.object({
  id: z.string(),
  code: z.string(),
  label: z.string(),
  priceDeltaCents: z.number().int().default(0),
  meta: z.record(z.unknown()).optional(),
});

export const ProductOptionSchema = z.object({
  id: z.string(),
  kind: ProductOptionKindSchema,
  label: z.string(),
  required: z.boolean().default(false),
  values: z.array(ProductOptionValueSchema),
});

export const ProductDetailSchema = ProductSummarySchema.extend({
  description: z.string(),
  images: z.array(z.object({ url: z.string().url(), alt: z.string().nullable() })),
  vatRate: z.number().min(0).max(1),
  stock: z.number().int().nonnegative(),
  options: z.array(ProductOptionSchema),
});
export type ProductDetail = z.infer<typeof ProductDetailSchema>;
