import { z } from 'zod';

/**
 * ConfiguratorState is the user-authored customisation.
 * Persisted on cart/order items and consumed by BOTH the 2D canvas preview
 * and any future R3F/three.js 3D viewer — the contract is intentionally
 * render-agnostic (describes the candle, not how it's drawn).
 *
 * shape / finish / platform are free-form strings defined by the admin
 * when creating product options. The renderer applies the closest preset
 * and falls back gracefully for unknown codes.
 */
export const ConfiguratorStateSchema = z.object({
  productId: z.string(),
  shape: z.string().min(1),
  sizeCode: z.string(), // e.g. "S" | "M" | "L" — resolved against product options
  color: z.object({
    hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    name: z.string().optional(),
  }),
  finish: z.string().min(1),
  platform: z.string().min(1),
  label: z
    .object({
      text: z.string().max(60).default(''),
      font: z.enum(['serif', 'script', 'sans']).default('serif'),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#2B201A'),
    })
    .default({ text: '', font: 'serif', color: '#2B201A' }),
  accessories: z.array(z.string()).default([]),
  quantity: z.number().int().min(1).max(50).default(1),
});
export type ConfiguratorState = z.infer<typeof ConfiguratorStateSchema>;

/** Diff patch emitted by the client on each control change. */
export const ConfiguratorPatchSchema = ConfiguratorStateSchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  { message: 'patch must not be empty' },
);
export type ConfiguratorPatch = z.infer<typeof ConfiguratorPatchSchema>;

/** Server → client realtime payload. */
export const ConfiguratorServerStateSchema = z.object({
  state: ConfiguratorStateSchema,
  price: z.object({
    unitCents: z.number().int().nonnegative(),
    totalCents: z.number().int().nonnegative(),
    breakdown: z.array(
      z.object({
        label: z.string(),
        amountCents: z.number().int(),
      }),
    ),
  }),
  availability: z.object({
    inStock: z.boolean(),
    remaining: z.number().int().nonnegative().nullable(),
  }),
  warnings: z.array(z.string()).default([]),
});
export type ConfiguratorServerState = z.infer<typeof ConfiguratorServerStateSchema>;

export const CONFIGURATOR_EVENTS = {
  Join: 'configurator:join',
  Update: 'configurator:update',
  State: 'configurator:state',
  Error: 'configurator:error',
} as const;
