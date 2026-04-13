"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandResultSchema = exports.OrderStatusBatchInputSchema = exports.BulkInventoryUpdateInputSchema = exports.RecalculatePricingInputSchema = exports.CommandNameSchema = void 0;
const zod_1 = require("zod");
exports.CommandNameSchema = zod_1.z.enum([
    'recalculate-pricing',
    'bulk-inventory-update',
    'order-status-batch',
]);
exports.RecalculatePricingInputSchema = zod_1.z.object({
    categoryId: zod_1.z.string().optional(),
    multiplier: zod_1.z.number().positive().max(10).default(1),
    roundToCents: zod_1.z.number().int().positive().default(10),
    dryRun: zod_1.z.boolean().default(false),
});
exports.BulkInventoryUpdateInputSchema = zod_1.z.object({
    updates: zod_1.z
        .array(zod_1.z.object({
        productId: zod_1.z.string(),
        stockDelta: zod_1.z.number().int(),
        reason: zod_1.z.string().min(2).max(200),
    }))
        .min(1)
        .max(500),
    dryRun: zod_1.z.boolean().default(false),
});
exports.OrderStatusBatchInputSchema = zod_1.z.object({
    orderIds: zod_1.z.array(zod_1.z.string()).min(1).max(200),
    targetStatus: zod_1.z.enum(['FULFILLED', 'SHIPPED', 'CANCELLED']),
    note: zod_1.z.string().max(200).optional().default(''),
});
exports.CommandResultSchema = zod_1.z.object({
    name: exports.CommandNameSchema,
    success: zod_1.z.boolean(),
    durationMs: zod_1.z.number().int().nonnegative(),
    affected: zod_1.z.number().int().nonnegative(),
    summary: zod_1.z.string(),
    dryRun: zod_1.z.boolean().default(false),
    errors: zod_1.z
        .array(zod_1.z.object({ code: zod_1.z.string(), message: zod_1.z.string(), context: zod_1.z.unknown().optional() }))
        .default([]),
});
//# sourceMappingURL=index.js.map