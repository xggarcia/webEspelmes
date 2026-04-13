import { Injectable } from '@nestjs/common';
import type { ConfiguratorState } from '@espelmes/shared';
import type { Product, ProductOption, ProductOptionValue } from '@prisma/client';

export type LoadedProduct = Product & {
  options: (ProductOption & { values: ProductOptionValue[] })[];
};

export type PriceBreakdown = {
  label: string;
  amountCents: number;
};

export type PricingResult = {
  unitCents: number;
  totalCents: number;
  breakdown: PriceBreakdown[];
  warnings: string[];
};

/**
 * Pure pricing engine — given a product with its options loaded and a
 * configurator state, computes unit + total price and an itemised breakdown.
 * Also reports warnings for unknown option codes (kept non-fatal so the
 * storefront can surface them to the user while still showing a price).
 */
@Injectable()
export class PricingEngine {
  compute(product: LoadedProduct, state: ConfiguratorState): PricingResult {
    const warnings: string[] = [];
    const breakdown: PriceBreakdown[] = [
      { label: 'Base', amountCents: product.basePriceCents },
    ];

    const findValue = (
      kind: ProductOption['kind'],
      code: string,
    ): ProductOptionValue | undefined => {
      const opt = product.options.find((o) => o.kind === kind);
      if (!opt) return undefined;
      return opt.values.find((v) => v.code === code);
    };

    const addDelta = (label: string, value: ProductOptionValue | undefined, code: string) => {
      if (!value) {
        warnings.push(`Unknown option: ${label} "${code}"`);
        return;
      }
      if (value.priceDeltaCents !== 0) {
        breakdown.push({ label: `${label}: ${value.label}`, amountCents: value.priceDeltaCents });
      }
    };

    addDelta('Shape', findValue('shape', state.shape), state.shape);
    addDelta('Size', findValue('size', state.sizeCode), state.sizeCode);
    addDelta('Finish', findValue('finish', state.finish), state.finish);
    addDelta('Platform', findValue('platform', state.platform), state.platform);

    const colorOpt = product.options.find((o) => o.kind === 'color');
    if (colorOpt) {
      const match = colorOpt.values.find((v) => {
        const meta = v.meta as { hex?: string } | null;
        return meta?.hex?.toLowerCase() === state.color.hex.toLowerCase();
      });
      if (match && match.priceDeltaCents !== 0) {
        breakdown.push({ label: `Color: ${match.label}`, amountCents: match.priceDeltaCents });
      }
    }

    if (state.label.text.trim().length > 0) {
      const labelOpt = product.options.find((o) => o.kind === 'label');
      const labelValue = labelOpt?.values[0];
      if (labelValue && labelValue.priceDeltaCents !== 0) {
        breakdown.push({
          label: `Personalised label`,
          amountCents: labelValue.priceDeltaCents,
        });
      }
    }

    for (const code of state.accessories) {
      const value = findValue('accessory', code);
      addDelta('Accessory', value, code);
    }

    const unitCents = breakdown.reduce((sum, b) => sum + b.amountCents, 0);
    const totalCents = unitCents * state.quantity;

    return { unitCents, totalCents, breakdown, warnings };
  }
}
