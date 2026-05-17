'use client';

import { useState } from 'react';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { ProductColorPicker, type ColorOption } from './ProductColorPicker';
import { ProductScentPicker, type ScentOption } from './ProductScentPicker';

export function ProductActions({
  productId,
  inStock,
  colors,
  scents,
  isCustomizable,
  locale,
  addToCartLabel,
  colorLabel,
  scentLabel,
  selectColorLabel,
  selectScentLabel,
}: {
  productId: string;
  inStock: boolean;
  colors: ColorOption[];
  scents: ScentOption[];
  isCustomizable: boolean;
  locale: string;
  addToCartLabel: string;
  colorLabel: string;
  scentLabel: string;
  selectColorLabel: string;
  selectScentLabel: string;
}) {
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [selectedScentId, setSelectedScentId] = useState<string | null>(null);

  const selectedColor = colors.find((c) => c.id === selectedColorId) ?? null;
  const selectedScent = scents.find((s) => s.id === selectedScentId) ?? null;

  const customization: Record<string, unknown> = {};
  if (selectedColor) customization.color = selectedColor;
  if (selectedScent) {
    customization.scent = {
      id: selectedScent.id,
      name: locale === 'es' ? selectedScent.nameEs : selectedScent.nameCa,
    };
  }

  const needsColor = isCustomizable && colors.length > 0 && !selectedColorId;
  const needsScent = isCustomizable && scents.length > 0 && !selectedScentId;
  const blocked = needsColor || needsScent;

  const hint = needsColor
    ? selectColorLabel
    : needsScent
      ? selectScentLabel
      : null;

  return (
    <div className="space-y-6">
      {isCustomizable && colors.length > 0 && (
        <ProductColorPicker
          colors={colors}
          selected={selectedColorId}
          onChange={setSelectedColorId}
          label={colorLabel}
        />
      )}

      {isCustomizable && scents.length > 0 && (
        <ProductScentPicker
          scents={scents}
          selected={selectedScentId}
          onChange={setSelectedScentId}
          locale={locale}
          label={scentLabel}
        />
      )}

      <div className="space-y-2">
        <AddToCartButton
          productId={productId}
          disabled={!inStock || blocked}
          label={addToCartLabel}
          customization={Object.keys(customization).length > 0 ? customization : null}
        />
        {hint && <p className="text-xs text-ink/50">{hint}</p>}
      </div>
    </div>
  );
}
