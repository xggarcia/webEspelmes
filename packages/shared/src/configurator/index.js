"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIGURATOR_EVENTS = exports.ConfiguratorServerStateSchema = exports.ConfiguratorPatchSchema = exports.ConfiguratorStateSchema = void 0;
const zod_1 = require("zod");
const catalog_1 = require("../catalog");
/**
 * ConfiguratorState is the user-authored customisation.
 * Persisted on cart/order items and consumed by BOTH the 2D canvas preview
 * and any future R3F/three.js 3D viewer — the contract is intentionally
 * render-agnostic (describes the candle, not how it's drawn).
 */
exports.ConfiguratorStateSchema = zod_1.z.object({
    productId: zod_1.z.string(),
    shape: catalog_1.CandleShapeSchema,
    sizeCode: zod_1.z.string(), // e.g. "S" | "M" | "L" — resolved against product options
    color: zod_1.z.object({
        hex: zod_1.z.string().regex(/^#[0-9a-fA-F]{6}$/),
        name: zod_1.z.string().optional(),
    }),
    finish: catalog_1.CandleFinishSchema,
    platform: catalog_1.PlatformSchema,
    label: zod_1.z
        .object({
        text: zod_1.z.string().max(60).default(''),
        font: zod_1.z.enum(['serif', 'script', 'sans']).default('serif'),
        color: zod_1.z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#2B201A'),
    })
        .default({ text: '', font: 'serif', color: '#2B201A' }),
    accessories: zod_1.z.array(zod_1.z.string()).default([]),
    quantity: zod_1.z.number().int().min(1).max(50).default(1),
});
/** Diff patch emitted by the client on each control change. */
exports.ConfiguratorPatchSchema = exports.ConfiguratorStateSchema.partial().refine((v) => Object.keys(v).length > 0, { message: 'patch must not be empty' });
/** Server → client realtime payload. */
exports.ConfiguratorServerStateSchema = zod_1.z.object({
    state: exports.ConfiguratorStateSchema,
    price: zod_1.z.object({
        unitCents: zod_1.z.number().int().nonnegative(),
        totalCents: zod_1.z.number().int().nonnegative(),
        breakdown: zod_1.z.array(zod_1.z.object({
            label: zod_1.z.string(),
            amountCents: zod_1.z.number().int(),
        })),
    }),
    availability: zod_1.z.object({
        inStock: zod_1.z.boolean(),
        remaining: zod_1.z.number().int().nonnegative().nullable(),
    }),
    warnings: zod_1.z.array(zod_1.z.string()).default([]),
});
exports.CONFIGURATOR_EVENTS = {
    Join: 'configurator:join',
    Update: 'configurator:update',
    State: 'configurator:state',
    Error: 'configurator:error',
};
//# sourceMappingURL=index.js.map