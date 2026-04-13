import { z } from 'zod';
import { ConfiguratorStateSchema } from '@espelmes/shared';

export const AddCartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(50).default(1),
  customization: ConfiguratorStateSchema.optional(),
});
export type AddCartItemDto = z.infer<typeof AddCartItemSchema>;

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(50),
});
export type UpdateCartItemDto = z.infer<typeof UpdateCartItemSchema>;
