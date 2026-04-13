import { z } from 'zod';

export const OrderStatusSchema = z.enum([
  'PENDING',
  'PAID',
  'FULFILLED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['FULFILLED', 'CANCELLED', 'REFUNDED'],
  FULFILLED: ['SHIPPED', 'REFUNDED'],
  SHIPPED: ['DELIVERED', 'REFUNDED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

export const AddressSchema = z.object({
  fullName: z.string().min(2).max(120),
  street: z.string().min(3).max(200),
  street2: z.string().max(200).optional().default(''),
  city: z.string().min(2).max(120),
  region: z.string().max(120).optional().default(''),
  postalCode: z.string().min(3).max(20),
  country: z.string().length(2).default('ES'),
  phone: z.string().max(40).optional().default(''),
});
export type Address = z.infer<typeof AddressSchema>;

export const CheckoutStartSchema = z.object({
  shipping: AddressSchema,
  billing: AddressSchema.optional(),
  notes: z.string().max(500).optional().default(''),
});
export type CheckoutStartInput = z.infer<typeof CheckoutStartSchema>;
