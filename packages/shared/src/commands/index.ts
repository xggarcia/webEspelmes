import { z } from 'zod';

export const CommandNameSchema = z.enum([
  'recalculate-pricing',
  'bulk-inventory-update',
  'order-status-batch',
]);
export type CommandName = z.infer<typeof CommandNameSchema>;

export const RecalculatePricingInputSchema = z.object({
  categoryId: z.string().optional(),
  multiplier: z.number().positive().max(10).default(1),
  roundToCents: z.number().int().positive().default(10),
  dryRun: z.boolean().default(false),
});
export type RecalculatePricingInput = z.infer<typeof RecalculatePricingInputSchema>;

export const BulkInventoryUpdateInputSchema = z.object({
  updates: z
    .array(
      z.object({
        productId: z.string(),
        stockDelta: z.number().int(),
        reason: z.string().min(2).max(200),
      }),
    )
    .min(1)
    .max(500),
  dryRun: z.boolean().default(false),
});
export type BulkInventoryUpdateInput = z.infer<typeof BulkInventoryUpdateInputSchema>;

export const OrderStatusBatchInputSchema = z.object({
  orderIds: z.array(z.string()).min(1).max(200),
  targetStatus: z.enum(['FULFILLED', 'SHIPPED', 'CANCELLED']),
  note: z.string().max(200).optional().default(''),
});
export type OrderStatusBatchInput = z.infer<typeof OrderStatusBatchInputSchema>;

export const CommandResultSchema = z.object({
  name: CommandNameSchema,
  success: z.boolean(),
  durationMs: z.number().int().nonnegative(),
  affected: z.number().int().nonnegative(),
  summary: z.string(),
  dryRun: z.boolean().default(false),
  errors: z
    .array(z.object({ code: z.string(), message: z.string(), context: z.unknown().optional() }))
    .default([]),
});
export type CommandResult = z.infer<typeof CommandResultSchema>;
