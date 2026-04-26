import { adminFetch as safeApiFetch } from '@/lib/api-admin';
import { ProductForm } from '@/components/admin/ProductForm';

type Category = { id: string; name: string; slug: string };

export default async function NewProductPage() {
  const categories = (await safeApiFetch<Category[]>('/categories')) ?? [];

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl text-ink">Nou producte</h2>
      <ProductForm
        categories={categories}
        initial={{
          slug: '',
          name: '',
          shortDescription: '',
          description: '',
          basePriceCents: 0,
          stock: 0,
          categoryId: '',
          isCustomizable: true,
          isActive: true,
          vatRate: 0.21,
          heroImageUrl: null,
        }}
      />
    </div>
  );
}
