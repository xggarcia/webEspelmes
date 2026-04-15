import { notFound } from 'next/navigation';
import { safeApiFetch } from '@/lib/api-server';
import { ProductForm } from '@/components/admin/ProductForm';

type Category = { id: string; name: string; slug: string };
type OptionValue = {
  id: string;
  code: string;
  label: string;
  priceDeltaCents: number;
  meta: Record<string, unknown> | null;
  sortOrder: number;
};
type ProductOption = {
  id: string;
  kind: 'color' | 'size' | 'finish' | 'shape' | 'platform' | 'label' | 'accessory';
  label: string;
  required: boolean;
  sortOrder: number;
  values: OptionValue[];
};
type AdminProductDetail = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  basePriceCents: number;
  stock: number;
  categoryId: string;
  isCustomizable: boolean;
  isActive: boolean;
  vatRate: number;
  heroImageUrl: string | null;
  modelUrl: string | null;
  modelMeta: { scale?: number; yOffset?: number; cameraFov?: number } | null;
  options: ProductOption[];
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    safeApiFetch<AdminProductDetail>(`/admin/products/${id}`, { forwardCookies: true }),
    safeApiFetch<Category[]>('/categories', { forwardCookies: true }),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl text-ink">{product.name}</h2>
      <ProductForm
        categories={categories ?? []}
        initialOptions={product.options ?? []}
        initial={{
          id: product.id,
          slug: product.slug,
          name: product.name,
          shortDescription: product.shortDescription,
          description: product.description,
          basePriceCents: product.basePriceCents,
          stock: product.stock,
          categoryId: product.categoryId,
          isCustomizable: product.isCustomizable,
          isActive: product.isActive,
          vatRate: product.vatRate,
          heroImageUrl: product.heroImageUrl,
          modelUrl: product.modelUrl ?? null,
          modelMeta: product.modelMeta ?? null,
        }}
      />
    </div>
  );
}
