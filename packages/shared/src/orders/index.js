"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutStartSchema = exports.AddressSchema = exports.ALLOWED_TRANSITIONS = exports.OrderStatusSchema = void 0;
const zod_1 = require("zod");
exports.OrderStatusSchema = zod_1.z.enum([
    'PENDING',
    'PAID',
    'FULFILLED',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
]);
exports.ALLOWED_TRANSITIONS = {
    PENDING: ['PAID', 'CANCELLED'],
    PAID: ['FULFILLED', 'CANCELLED', 'REFUNDED'],
    FULFILLED: ['SHIPPED', 'REFUNDED'],
    SHIPPED: ['DELIVERED', 'REFUNDED'],
    DELIVERED: ['REFUNDED'],
    CANCELLED: [],
    REFUNDED: [],
};
exports.AddressSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2).max(120),
    street: zod_1.z.string().min(3).max(200),
    street2: zod_1.z.string().max(200).optional().default(''),
    city: zod_1.z.string().min(2).max(120),
    region: zod_1.z.string().max(120).optional().default(''),
    postalCode: zod_1.z.string().min(3).max(20),
    country: zod_1.z.string().length(2).default('ES'),
    phone: zod_1.z.string().max(40).optional().default(''),
});
exports.CheckoutStartSchema = zod_1.z.object({
    shipping: exports.AddressSchema,
    billing: exports.AddressSchema.optional(),
    notes: zod_1.z.string().max(500).optional().default(''),
});
//# sourceMappingURL=index.js.map