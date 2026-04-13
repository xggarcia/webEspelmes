import { z } from 'zod';
export declare const CandleShapeSchema: z.ZodEnum<["pillar", "taper", "votive", "container", "heart", "sphere"]>;
export type CandleShape = z.infer<typeof CandleShapeSchema>;
export declare const CandleFinishSchema: z.ZodEnum<["matte", "glossy", "pearl", "textured"]>;
export type CandleFinish = z.infer<typeof CandleFinishSchema>;
export declare const PlatformSchema: z.ZodEnum<["none", "wood", "ceramic", "metal"]>;
export type PlatformType = z.infer<typeof PlatformSchema>;
export declare const ProductOptionKindSchema: z.ZodEnum<["color", "size", "finish", "shape", "platform", "label", "accessory"]>;
export type ProductOptionKind = z.infer<typeof ProductOptionKindSchema>;
export declare const ProductSummarySchema: z.ZodObject<{
    id: z.ZodString;
    slug: z.ZodString;
    name: z.ZodString;
    shortDescription: z.ZodNullable<z.ZodString>;
    basePriceCents: z.ZodNumber;
    currency: z.ZodLiteral<"EUR">;
    heroImageUrl: z.ZodNullable<z.ZodString>;
    categorySlug: z.ZodString;
    isCustomizable: z.ZodBoolean;
    inStock: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    slug: string;
    shortDescription: string | null;
    basePriceCents: number;
    currency: "EUR";
    heroImageUrl: string | null;
    categorySlug: string;
    isCustomizable: boolean;
    inStock: boolean;
}, {
    name: string;
    id: string;
    slug: string;
    shortDescription: string | null;
    basePriceCents: number;
    currency: "EUR";
    heroImageUrl: string | null;
    categorySlug: string;
    isCustomizable: boolean;
    inStock: boolean;
}>;
export type ProductSummary = z.infer<typeof ProductSummarySchema>;
export declare const ProductOptionValueSchema: z.ZodObject<{
    id: z.ZodString;
    code: z.ZodString;
    label: z.ZodString;
    priceDeltaCents: z.ZodDefault<z.ZodNumber>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    code: string;
    label: string;
    id: string;
    priceDeltaCents: number;
    meta?: Record<string, unknown> | undefined;
}, {
    code: string;
    label: string;
    id: string;
    priceDeltaCents?: number | undefined;
    meta?: Record<string, unknown> | undefined;
}>;
export declare const ProductOptionSchema: z.ZodObject<{
    id: z.ZodString;
    kind: z.ZodEnum<["color", "size", "finish", "shape", "platform", "label", "accessory"]>;
    label: z.ZodString;
    required: z.ZodDefault<z.ZodBoolean>;
    values: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        code: z.ZodString;
        label: z.ZodString;
        priceDeltaCents: z.ZodDefault<z.ZodNumber>;
        meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        label: string;
        id: string;
        priceDeltaCents: number;
        meta?: Record<string, unknown> | undefined;
    }, {
        code: string;
        label: string;
        id: string;
        priceDeltaCents?: number | undefined;
        meta?: Record<string, unknown> | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    values: {
        code: string;
        label: string;
        id: string;
        priceDeltaCents: number;
        meta?: Record<string, unknown> | undefined;
    }[];
    label: string;
    id: string;
    kind: "color" | "size" | "finish" | "shape" | "platform" | "label" | "accessory";
    required: boolean;
}, {
    values: {
        code: string;
        label: string;
        id: string;
        priceDeltaCents?: number | undefined;
        meta?: Record<string, unknown> | undefined;
    }[];
    label: string;
    id: string;
    kind: "color" | "size" | "finish" | "shape" | "platform" | "label" | "accessory";
    required?: boolean | undefined;
}>;
export declare const ProductDetailSchema: z.ZodObject<{
    id: z.ZodString;
    slug: z.ZodString;
    name: z.ZodString;
    shortDescription: z.ZodNullable<z.ZodString>;
    basePriceCents: z.ZodNumber;
    currency: z.ZodLiteral<"EUR">;
    heroImageUrl: z.ZodNullable<z.ZodString>;
    categorySlug: z.ZodString;
    isCustomizable: z.ZodBoolean;
    inStock: z.ZodBoolean;
} & {
    description: z.ZodString;
    images: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        alt: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        alt: string | null;
    }, {
        url: string;
        alt: string | null;
    }>, "many">;
    vatRate: z.ZodNumber;
    stock: z.ZodNumber;
    options: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        kind: z.ZodEnum<["color", "size", "finish", "shape", "platform", "label", "accessory"]>;
        label: z.ZodString;
        required: z.ZodDefault<z.ZodBoolean>;
        values: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            code: z.ZodString;
            label: z.ZodString;
            priceDeltaCents: z.ZodDefault<z.ZodNumber>;
            meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, "strip", z.ZodTypeAny, {
            code: string;
            label: string;
            id: string;
            priceDeltaCents: number;
            meta?: Record<string, unknown> | undefined;
        }, {
            code: string;
            label: string;
            id: string;
            priceDeltaCents?: number | undefined;
            meta?: Record<string, unknown> | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        values: {
            code: string;
            label: string;
            id: string;
            priceDeltaCents: number;
            meta?: Record<string, unknown> | undefined;
        }[];
        label: string;
        id: string;
        kind: "color" | "size" | "finish" | "shape" | "platform" | "label" | "accessory";
        required: boolean;
    }, {
        values: {
            code: string;
            label: string;
            id: string;
            priceDeltaCents?: number | undefined;
            meta?: Record<string, unknown> | undefined;
        }[];
        label: string;
        id: string;
        kind: "color" | "size" | "finish" | "shape" | "platform" | "label" | "accessory";
        required?: boolean | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    options: {
        values: {
            code: string;
            label: string;
            id: string;
            priceDeltaCents: number;
            meta?: Record<string, unknown> | undefined;
        }[];
        label: string;
        id: string;
        kind: "color" | "size" | "finish" | "shape" | "platform" | "label" | "accessory";
        required: boolean;
    }[];
    name: string;
    id: string;
    slug: string;
    shortDescription: string | null;
    basePriceCents: number;
    currency: "EUR";
    heroImageUrl: string | null;
    categorySlug: string;
    isCustomizable: boolean;
    inStock: boolean;
    description: string;
    images: {
        url: string;
        alt: string | null;
    }[];
    vatRate: number;
    stock: number;
}, {
    options: {
        values: {
            code: string;
            label: string;
            id: string;
            priceDeltaCents?: number | undefined;
            meta?: Record<string, unknown> | undefined;
        }[];
        label: string;
        id: string;
        kind: "color" | "size" | "finish" | "shape" | "platform" | "label" | "accessory";
        required?: boolean | undefined;
    }[];
    name: string;
    id: string;
    slug: string;
    shortDescription: string | null;
    basePriceCents: number;
    currency: "EUR";
    heroImageUrl: string | null;
    categorySlug: string;
    isCustomizable: boolean;
    inStock: boolean;
    description: string;
    images: {
        url: string;
        alt: string | null;
    }[];
    vatRate: number;
    stock: number;
}>;
export type ProductDetail = z.infer<typeof ProductDetailSchema>;
//# sourceMappingURL=index.d.ts.map