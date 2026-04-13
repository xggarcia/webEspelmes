import { z } from 'zod';
/**
 * ConfiguratorState is the user-authored customisation.
 * Persisted on cart/order items and consumed by BOTH the 2D canvas preview
 * and any future R3F/three.js 3D viewer — the contract is intentionally
 * render-agnostic (describes the candle, not how it's drawn).
 */
export declare const ConfiguratorStateSchema: z.ZodObject<{
    productId: z.ZodString;
    shape: z.ZodEnum<["pillar", "taper", "votive", "container", "heart", "sphere"]>;
    sizeCode: z.ZodString;
    color: z.ZodObject<{
        hex: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        hex: string;
        name?: string | undefined;
    }, {
        hex: string;
        name?: string | undefined;
    }>;
    finish: z.ZodEnum<["matte", "glossy", "pearl", "textured"]>;
    platform: z.ZodEnum<["none", "wood", "ceramic", "metal"]>;
    label: z.ZodDefault<z.ZodObject<{
        text: z.ZodDefault<z.ZodString>;
        font: z.ZodDefault<z.ZodEnum<["serif", "script", "sans"]>>;
        color: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        color: string;
        text: string;
        font: "serif" | "script" | "sans";
    }, {
        color?: string | undefined;
        text?: string | undefined;
        font?: "serif" | "script" | "sans" | undefined;
    }>>;
    accessories: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    quantity: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    color: {
        hex: string;
        name?: string | undefined;
    };
    finish: "matte" | "glossy" | "pearl" | "textured";
    shape: "pillar" | "taper" | "votive" | "container" | "heart" | "sphere";
    platform: "none" | "wood" | "ceramic" | "metal";
    label: {
        color: string;
        text: string;
        font: "serif" | "script" | "sans";
    };
    productId: string;
    sizeCode: string;
    accessories: string[];
    quantity: number;
}, {
    color: {
        hex: string;
        name?: string | undefined;
    };
    finish: "matte" | "glossy" | "pearl" | "textured";
    shape: "pillar" | "taper" | "votive" | "container" | "heart" | "sphere";
    platform: "none" | "wood" | "ceramic" | "metal";
    productId: string;
    sizeCode: string;
    label?: {
        color?: string | undefined;
        text?: string | undefined;
        font?: "serif" | "script" | "sans" | undefined;
    } | undefined;
    accessories?: string[] | undefined;
    quantity?: number | undefined;
}>;
export type ConfiguratorState = z.infer<typeof ConfiguratorStateSchema>;
/** Diff patch emitted by the client on each control change. */
export declare const ConfiguratorPatchSchema: z.ZodEffects<z.ZodObject<{
    productId: z.ZodOptional<z.ZodString>;
    shape: z.ZodOptional<z.ZodEnum<["pillar", "taper", "votive", "container", "heart", "sphere"]>>;
    sizeCode: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodObject<{
        hex: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        hex: string;
        name?: string | undefined;
    }, {
        hex: string;
        name?: string | undefined;
    }>>;
    finish: z.ZodOptional<z.ZodEnum<["matte", "glossy", "pearl", "textured"]>>;
    platform: z.ZodOptional<z.ZodEnum<["none", "wood", "ceramic", "metal"]>>;
    label: z.ZodOptional<z.ZodDefault<z.ZodObject<{
        text: z.ZodDefault<z.ZodString>;
        font: z.ZodDefault<z.ZodEnum<["serif", "script", "sans"]>>;
        color: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        color: string;
        text: string;
        font: "serif" | "script" | "sans";
    }, {
        color?: string | undefined;
        text?: string | undefined;
        font?: "serif" | "script" | "sans" | undefined;
    }>>>;
    accessories: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    quantity: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    color?: {
        hex: string;
        name?: string | undefined;
    } | undefined;
    finish?: "matte" | "glossy" | "pearl" | "textured" | undefined;
    shape?: "pillar" | "taper" | "votive" | "container" | "heart" | "sphere" | undefined;
    platform?: "none" | "wood" | "ceramic" | "metal" | undefined;
    label?: {
        color: string;
        text: string;
        font: "serif" | "script" | "sans";
    } | undefined;
    productId?: string | undefined;
    sizeCode?: string | undefined;
    accessories?: string[] | undefined;
    quantity?: number | undefined;
}, {
    color?: {
        hex: string;
        name?: string | undefined;
    } | undefined;
    finish?: "matte" | "glossy" | "pearl" | "textured" | undefined;
    shape?: "pillar" | "taper" | "votive" | "container" | "heart" | "sphere" | undefined;
    platform?: "none" | "wood" | "ceramic" | "metal" | undefined;
    label?: {
        color?: string | undefined;
        text?: string | undefined;
        font?: "serif" | "script" | "sans" | undefined;
    } | undefined;
    productId?: string | undefined;
    sizeCode?: string | undefined;
    accessories?: string[] | undefined;
    quantity?: number | undefined;
}>, {
    color?: {
        hex: string;
        name?: string | undefined;
    } | undefined;
    finish?: "matte" | "glossy" | "pearl" | "textured" | undefined;
    shape?: "pillar" | "taper" | "votive" | "container" | "heart" | "sphere" | undefined;
    platform?: "none" | "wood" | "ceramic" | "metal" | undefined;
    label?: {
        color: string;
        text: string;
        font: "serif" | "script" | "sans";
    } | undefined;
    productId?: string | undefined;
    sizeCode?: string | undefined;
    accessories?: string[] | undefined;
    quantity?: number | undefined;
}, {
    color?: {
        hex: string;
        name?: string | undefined;
    } | undefined;
    finish?: "matte" | "glossy" | "pearl" | "textured" | undefined;
    shape?: "pillar" | "taper" | "votive" | "container" | "heart" | "sphere" | undefined;
    platform?: "none" | "wood" | "ceramic" | "metal" | undefined;
    label?: {
        color?: string | undefined;
        text?: string | undefined;
        font?: "serif" | "script" | "sans" | undefined;
    } | undefined;
    productId?: string | undefined;
    sizeCode?: string | undefined;
    accessories?: string[] | undefined;
    quantity?: number | undefined;
}>;
export type ConfiguratorPatch = z.infer<typeof ConfiguratorPatchSchema>;
/** Server → client realtime payload. */
export declare const ConfiguratorServerStateSchema: z.ZodObject<{
    state: z.ZodObject<{
        productId: z.ZodString;
        shape: z.ZodEnum<["pillar", "taper", "votive", "container", "heart", "sphere"]>;
        sizeCode: z.ZodString;
        color: z.ZodObject<{
            hex: z.ZodString;
            name: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            hex: string;
            name?: string | undefined;
        }, {
            hex: string;
            name?: string | undefined;
        }>;
        finish: z.ZodEnum<["matte", "glossy", "pearl", "textured"]>;
        platform: z.ZodEnum<["none", "wood", "ceramic", "metal"]>;
        label: z.ZodDefault<z.ZodObject<{
            text: z.ZodDefault<z.ZodString>;
            font: z.ZodDefault<z.ZodEnum<["serif", "script", "sans"]>>;
            color: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            color: string;
            text: string;
            font: "serif" | "script" | "sans";
        }, {
            color?: string | undefined;
            text?: string | undefined;
            font?: "serif" | "script" | "sans" | undefined;
        }>>;
        accessories: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        quantity: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        color: {
            hex: string;
            name?: string | undefined;
        };
        finish: "matte" | "glossy" | "pearl" | "textured";
        shape: "pillar" | "taper" | "votive" | "container" | "heart" | "sphere";
        platform: "none" | "wood" | "ceramic" | "metal";
        label: {
            color: string;
            text: string;
            font: "serif" | "script" | "sans";
        };
        productId: string;
        sizeCode: string;
        accessories: string[];
        quantity: number;
    }, {
        color: {
            hex: string;
            name?: string | undefined;
        };
        finish: "matte" | "glossy" | "pearl" | "textured";
        shape: "pillar" | "taper" | "votive" | "container" | "heart" | "sphere";
        platform: "none" | "wood" | "ceramic" | "metal";
        productId: string;
        sizeCode: string;
        label?: {
            color?: string | undefined;
            text?: string | undefined;
            font?: "serif" | "script" | "sans" | undefined;
        } | undefined;
        accessories?: string[] | undefined;
        quantity?: number | undefined;
    }>;
    price: z.ZodObject<{
        unitCents: z.ZodNumber;
        totalCents: z.ZodNumber;
        breakdown: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            amountCents: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            label: string;
            amountCents: number;
        }, {
            label: string;
            amountCents: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        unitCents: number;
        totalCents: number;
        breakdown: {
            label: string;
            amountCents: number;
        }[];
    }, {
        unitCents: number;
        totalCents: number;
        breakdown: {
            label: string;
            amountCents: number;
        }[];
    }>;
    availability: z.ZodObject<{
        inStock: z.ZodBoolean;
        remaining: z.ZodNullable<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        inStock: boolean;
        remaining: number | null;
    }, {
        inStock: boolean;
        remaining: number | null;
    }>;
    warnings: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    state: {
        color: {
            hex: string;
            name?: string | undefined;
        };
        finish: "matte" | "glossy" | "pearl" | "textured";
        shape: "pillar" | "taper" | "votive" | "container" | "heart" | "sphere";
        platform: "none" | "wood" | "ceramic" | "metal";
        label: {
            color: string;
            text: string;
            font: "serif" | "script" | "sans";
        };
        productId: string;
        sizeCode: string;
        accessories: string[];
        quantity: number;
    };
    price: {
        unitCents: number;
        totalCents: number;
        breakdown: {
            label: string;
            amountCents: number;
        }[];
    };
    availability: {
        inStock: boolean;
        remaining: number | null;
    };
    warnings: string[];
}, {
    state: {
        color: {
            hex: string;
            name?: string | undefined;
        };
        finish: "matte" | "glossy" | "pearl" | "textured";
        shape: "pillar" | "taper" | "votive" | "container" | "heart" | "sphere";
        platform: "none" | "wood" | "ceramic" | "metal";
        productId: string;
        sizeCode: string;
        label?: {
            color?: string | undefined;
            text?: string | undefined;
            font?: "serif" | "script" | "sans" | undefined;
        } | undefined;
        accessories?: string[] | undefined;
        quantity?: number | undefined;
    };
    price: {
        unitCents: number;
        totalCents: number;
        breakdown: {
            label: string;
            amountCents: number;
        }[];
    };
    availability: {
        inStock: boolean;
        remaining: number | null;
    };
    warnings?: string[] | undefined;
}>;
export type ConfiguratorServerState = z.infer<typeof ConfiguratorServerStateSchema>;
export declare const CONFIGURATOR_EVENTS: {
    readonly Join: "configurator:join";
    readonly Update: "configurator:update";
    readonly State: "configurator:state";
    readonly Error: "configurator:error";
};
//# sourceMappingURL=index.d.ts.map