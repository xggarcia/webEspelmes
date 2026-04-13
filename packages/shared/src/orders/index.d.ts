import { z } from 'zod';
export declare const OrderStatusSchema: z.ZodEnum<["PENDING", "PAID", "FULFILLED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]>;
export type OrderStatus = z.infer<typeof OrderStatusSchema>;
export declare const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]>;
export declare const AddressSchema: z.ZodObject<{
    fullName: z.ZodString;
    street: z.ZodString;
    street2: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    city: z.ZodString;
    region: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    postalCode: z.ZodString;
    country: z.ZodDefault<z.ZodString>;
    phone: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    fullName: string;
    street: string;
    street2: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
    phone: string;
}, {
    fullName: string;
    street: string;
    city: string;
    postalCode: string;
    street2?: string | undefined;
    region?: string | undefined;
    country?: string | undefined;
    phone?: string | undefined;
}>;
export type Address = z.infer<typeof AddressSchema>;
export declare const CheckoutStartSchema: z.ZodObject<{
    shipping: z.ZodObject<{
        fullName: z.ZodString;
        street: z.ZodString;
        street2: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        city: z.ZodString;
        region: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        postalCode: z.ZodString;
        country: z.ZodDefault<z.ZodString>;
        phone: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        fullName: string;
        street: string;
        street2: string;
        city: string;
        region: string;
        postalCode: string;
        country: string;
        phone: string;
    }, {
        fullName: string;
        street: string;
        city: string;
        postalCode: string;
        street2?: string | undefined;
        region?: string | undefined;
        country?: string | undefined;
        phone?: string | undefined;
    }>;
    billing: z.ZodOptional<z.ZodObject<{
        fullName: z.ZodString;
        street: z.ZodString;
        street2: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        city: z.ZodString;
        region: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        postalCode: z.ZodString;
        country: z.ZodDefault<z.ZodString>;
        phone: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        fullName: string;
        street: string;
        street2: string;
        city: string;
        region: string;
        postalCode: string;
        country: string;
        phone: string;
    }, {
        fullName: string;
        street: string;
        city: string;
        postalCode: string;
        street2?: string | undefined;
        region?: string | undefined;
        country?: string | undefined;
        phone?: string | undefined;
    }>>;
    notes: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    shipping: {
        fullName: string;
        street: string;
        street2: string;
        city: string;
        region: string;
        postalCode: string;
        country: string;
        phone: string;
    };
    notes: string;
    billing?: {
        fullName: string;
        street: string;
        street2: string;
        city: string;
        region: string;
        postalCode: string;
        country: string;
        phone: string;
    } | undefined;
}, {
    shipping: {
        fullName: string;
        street: string;
        city: string;
        postalCode: string;
        street2?: string | undefined;
        region?: string | undefined;
        country?: string | undefined;
        phone?: string | undefined;
    };
    billing?: {
        fullName: string;
        street: string;
        city: string;
        postalCode: string;
        street2?: string | undefined;
        region?: string | undefined;
        country?: string | undefined;
        phone?: string | undefined;
    } | undefined;
    notes?: string | undefined;
}>;
export type CheckoutStartInput = z.infer<typeof CheckoutStartSchema>;
//# sourceMappingURL=index.d.ts.map