import { safeApiFetch } from '@/lib/api-server';
import { formatEur } from '@/lib/currency';
import { Link } from '@/i18n/routing';

type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  basePriceCents: number;
  stock: number;
  isActive: boolean;
  isCustomizable: boolean;
  category: { name: string; slug: string } | null;
};

export default async function AdminProductsPage() {
  const products = await safeApiFetch<AdminProduct[]>('/admin/products', { forwardCookies: true });
  if (!products) return <p className="text-ember">Error carregant productes.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-ink">Productes ({products.length})</h2>
        <Link href="/admin/products/new" className="btn-primary">
          + Nou producte
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl2 border border-ink/10 bg-cream">
        <table className="w-full text-sm">
          <thead className="border-b border-ink/10 bg-wax/40 text-left text-xs uppercase tracking-widest text-ink/60">
            <tr>
              <th className="px-3 py-2">Nom</th>
              <th className="px-3 py-2">Categoria</th>
              <th className="px-3 py-2">Preu</th>
              <th className="px-3 py-2">Estoc</th>
              <th className="px-3 py-2">Estat</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="px-3 py-2">
                  <div className="font-medium text-ink">{p.name}</div>
                  <div className="text-xs text-ink/50">{p.slug}</div>
                </td>
                <td className="px-3 py-2 text-ink/70">{p.category?.name ?? '—'}</td>
                <td className="px-3 py-2 font-mono text-ember">{formatEur(p.basePriceCents)}</td>
                <td className={`px-3 py-2 font-mono ${p.stock === 0 ? 'text-ember' : p.stock <= 5 ? 'text-clay' : 'text-ink/70'}`}>
                  {p.stock}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${p.isActive ? 'bg-sage/20 text-sage' : 'bg-ink/10 text-ink/50'}`}>
                      {p.isActive ? 'Actiu' : 'Inactiu'}
                    </span>
                    {p.isCustomizable && (
                      <span className="rounded-full bg-ember/10 px-2 py-0.5 text-xs text-ember">
                        Personalitzable
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-right">
                  <Link href={`/admin/products/${p.id}`} className="text-sm text-ember hover:underline">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
