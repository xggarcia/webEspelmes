import { z } from 'zod';
export declare const LocaleSchema: z.ZodEnum<["ca", "es"]>;
export type Locale = z.infer<typeof LocaleSchema>;
export declare const MoneySchema: z.ZodObject<{
    amount: z.ZodNumber;
    currency: z.ZodDefault<z.ZodLiteral<"EUR">>;
}, "strip", z.ZodTypeAny, {
    currency: "EUR";
    amount: number;
}, {
    amount: number;
    currency?: "EUR" | undefined;
}>;
export type Money = z.infer<typeof MoneySchema>;
export declare const PageQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    pageSize: z.ZodDefault<z.ZodNumber>;
    sort: z.ZodDefault<z.ZodEnum<["new", "price_asc", "price_desc", "popular"]>>;
}, "strip", z.ZodTypeAny, {
    sort: "new" | "price_asc" | "price_desc" | "popular";
    page: number;
    pageSize: number;
}, {
    sort?: "new" | "price_asc" | "price_desc" | "popular" | undefined;
    page?: number | undefined;
    pageSize?: number | undefined;
}>;
export type PageQuery = z.infer<typeof PageQuerySchema>;
export declare const IdSchema: z.ZodUnion<[z.ZodUnion<[z.ZodString, z.ZodString]>, z.ZodString]>;
export type ApiError = {
    statusCode: number;
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
};
export declare const centsToEuro: (cents: number) => string;
//# sourceMappingURL=index.d.ts.map