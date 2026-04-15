import { safeApiFetch } from '@/lib/api-server';
import { formatEur } from '@/lib/currency';
import { Link } from '@/i18n/routing';

type Dashboard = {
  counts: { products: number; activeProducts: number; customers: number; openOrders: number };
  revenue: { lifetimeCents: number; lifetimeOrders: number; last30dOrders: number };
  lowStock: { id: string; name: string; slug: string; stock: number }[];
};

export default async function DashboardPage() {
  const data = await safeApiFetch<Dashboard>('/admin/dashboard', { forwardCookies: true });
  if (!data) {
    return <p className="text-ember">No s&apos;han pogut carregar les mètriques.</p>;
  }

  const kpis = [
    { label: 'Productes actius', value: `${data.counts.activeProducts} / ${data.counts.products}` },
    { label: 'Comandes obertes', value: data.counts.openOrders },
    { label: 'Clients', value: data.counts.customers },
    { label: 'Facturació acumulada', value: formatEur(data.revenue.lifetimeCents) },
    { label: 'Comandes últims 30 dies', value: data.revenue.last30dOrders },
    { label: 'Total comandes cobrades', value: data.revenue.lifetimeOrders },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.label} className="card-warm">
            <p className="text-xs uppercase tracking-widest text-ink/50">{k.label}</p>
            <p className="mt-1 font-display text-2xl text-ember">{k.value}</p>
          </div>
        ))}
      </section>

      <section className="card-warm">
        <h2 className="font-display text-xl text-ink">Estoc baix</h2>
        {data.lowStock.length === 0 ? (
          <p className="mt-2 text-sm text-ink/60">Tot correcte — cap producte per sota del llindar.</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink/10">
            {data.lowStock.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                <Link href={`/admin/products/${p.id}`} className="text-ink hover:text-ember">
                  {p.name}
                </Link>
                <span className={`font-mono ${p.stock === 0 ? 'text-ember' : 'text-ink/70'}`}>
                  {p.stock} u.
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
