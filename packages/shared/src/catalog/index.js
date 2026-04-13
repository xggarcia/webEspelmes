"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductDetailSchema = exports.ProductOptionSchema = exports.ProductOptionValueSchema = exports.ProductSummarySchema = exports.ProductOptionKindSchema = exports.PlatformSchema = exports.CandleFinishSchema = exports.CandleShapeSchema = void 0;
const zod_1 = require("zod");
exports.CandleShapeSchema = zod_1.z.enum([
    'pillar',
    'taper',
    'votive',
    'container',
    'heart',
    'sphere',
]);
exports.CandleFinishSchema = zod_1.z.enum(['matte', 'glossy', 'pearl', 'textured']);
exports.PlatformSchema = zod_1.z.enum(['none', 'wood', 'ceramic', 'metal']);
exports.ProductOptionKindSchema = zod_1.z.enum([
    'color',
    'size',
    'finish',
    'shape',
    'platform',
    'label',
    'accessory',
]);
exports.ProductSummarySchema = zod_1.z.object({
    id: zod_1.z.string(),
    slug: zod_1.z.string(),
    name: zod_1.z.string(),
    shortDescription: zod_1.z.string().nullable(),
    basePriceCents: zod_1.z.number().int().nonnegative(),
    currency: zod_1.z.literal('EUR'),
    heroImageUrl: zod_1.z.string().url().nullable(),
    categorySlug: zod_1.z.string(),
    isCustomizable: zod_1.z.boolean(),
    inStock: zod_1.z.boolean(),
});
exports.ProductOptionValueSchema = zod_1.z.object({
    id: zod_1.z.string(),
    code: zod_1.z.string(),
    label: zod_1.z.string(),
    priceDeltaCents: zod_1.z.number().int().default(0),
    meta: zod_1.z.record(zod_1.z.unknown()).optional(),
});
exports.ProductOptionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    kind: exports.ProductOptionKindSchema,
    label: zod_1.z.string(),
    required: zod_1.z.boolean().default(false),
    values: zod_1.z.array(exports.ProductOptionValueSchema),
});
exports.ProductDetailSchema = exports.ProductSummarySchema.extend({
    description: zod_1.z.string(),
    images: zod_1.z.array(zod_1.z.object({ url: zod_1.z.string().url(), alt: zod_1.z.string().nullable() })),
    vatRate: zod_1.z.number().min(0).max(1),
    stock: zod_1.z.number().int().nonnegative(),
    options: zod_1.z.array(exports.ProductOptionSchema),
});
//# sourceMappingURL=index.js.map