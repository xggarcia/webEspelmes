import { z } from 'zod';

export const LocaleSchema = z.enum(['ca', 'es']);
export type Locale = z.infer<typeof LocaleSchema>;

export const MoneySchema = z.object({
  amount: z.number().int().nonnegative(), // cents
  currency: z.literal('EUR').default('EUR'),
});
export type Money = z.infer<typeof MoneySchema>;

export const PageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(12),
  sort: z.enum(['new', 'price_asc', 'price_desc', 'popular']).default('new'),
});
export type PageQuery = z.infer<typeof PageQuerySchema>;

export const IdSchema = z.string().cuid2().or(z.string().uuid()).or(z.string().min(1));

export type ApiError = {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
};

export const centsToEuro = (cents: number): string =>
  new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100);
