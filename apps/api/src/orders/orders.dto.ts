import { z } from 'zod';
import { AddressSchema, OrderStatusSchema } from '@espelmes/shared';

export const StartCheckoutSchema = z.object({
  email: z.string().email(),
  shipping: AddressSchema,
  billing: AddressSchema.optional(),
  notes: z.string().max(500).optional().default(''),
});
export type StartCheckoutDto = z.infer<typeof StartCheckoutSchema>;

export const TransitionOrderSchema = z.object({
  status: OrderStatusSchema,
  reason: z.string().max(400).optional(),
});
export type TransitionOrderDto = z.infer<typeof TransitionOrderSchema>;
