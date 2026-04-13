import { z } from 'zod';
export declare const CommandNameSchema: z.ZodEnum<["recalculate-pricing", "bulk-inventory-update", "order-status-batch"]>;
export type CommandName = z.infer<typeof CommandNameSchema>;
export declare const RecalculatePricingInputSchema: z.ZodObject<{
    categoryId: z.ZodOptional<z.ZodString>;
    multiplier: z.ZodDefault<z.ZodNumber>;
    roundToCents: z.ZodDefault<z.ZodNumber>;
    dryRun: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    multiplier: number;
    roundToCents: number;
    dryRun: boolean;
    categoryId?: string | undefined;
}, {
    categoryId?: string | undefined;
    multiplier?: number | undefined;
    roundToCents?: number | undefined;
    dryRun?: boolean | undefined;
}>;
export type RecalculatePricingInput = z.infer<typeof RecalculatePricingInputSchema>;
export declare const BulkInventoryUpdateInputSchema: z.ZodObject<{
    updates: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        stockDelta: z.ZodNumber;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        stockDelta: number;
        reason: string;
    }, {
        productId: string;
        stockDelta: number;
        reason: string;
    }>, "many">;
    dryRun: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    dryRun: boolean;
    updates: {
        productId: string;
        stockDelta: number;
        reason: string;
    }[];
}, {
    updates: {
        productId: string;
        stockDelta: number;
        reason: string;
    }[];
    dryRun?: boolean | undefined;
}>;
export type BulkInventoryUpdateInput = z.infer<typeof BulkInventoryUpdateInputSchema>;
export declare const OrderStatusBatchInputSchema: z.ZodObject<{
    orderIds: z.ZodArray<z.ZodString, "many">;
    targetStatus: z.ZodEnum<["FULFILLED", "SHIPPED", "CANCELLED"]>;
    note: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    orderIds: string[];
    targetStatus: "FULFILLED" | "SHIPPED" | "CANCELLED";
    note: string;
}, {
    orderIds: string[];
    targetStatus: "FULFILLED" | "SHIPPED" | "CANCELLED";
    note?: string | undefined;
}>;
export type OrderStatusBatchInput = z.infer<typeof OrderStatusBatchInputSchema>;
export declare const CommandResultSchema: z.ZodObject<{
    name: z.ZodEnum<["recalculate-pricing", "bulk-inventory-update", "order-status-batch"]>;
    success: z.ZodBoolean;
    durationMs: z.ZodNumber;
    affected: z.ZodNumber;
    summary: z.ZodString;
    dryRun: z.ZodDefault<z.ZodBoolean>;
    errors: z.ZodDefault<z.ZodArray<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        context: z.ZodOptional<z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        context?: unknown;
    }, {
        code: string;
        message: string;
        context?: unknown;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: "recalculate-pricing" | "bulk-inventory-update" | "order-status-batch";
    dryRun: boolean;
    success: boolean;
    durationMs: number;
    affected: number;
    summary: string;
    errors: {
        code: string;
        message: string;
        context?: unknown;
    }[];
}, {
    name: "recalculate-pricing" | "bulk-inventory-update" | "order-status-batch";
    success: boolean;
    durationMs: number;
    affected: number;
    summary: string;
    dryRun?: boolean | undefined;
    errors?: {
        code: string;
        message: string;
        context?: unknown;
    }[] | undefined;
}>;
export type CommandResult = z.infer<typeof CommandResultSchema>;
//# sourceMappingURL=index.d.ts.map