import { adminFetch as safeApiFetch } from '@/lib/api-admin';
import { formatEur } from '@/lib/currency';
import { Link } from '@/i18n/routing';

type Order = {
  id: string;
  status: string;
  totalCents: number;
  createdAt: string;
  items: { quantity: number }[];
};

const statusColor: Record<string, string> = {
  PENDING: 'bg-clay/20 text-clay',
  PAID: 'bg-sage/20 text-sage',
  FULFILLED: 'bg-sage/30 text-sage',
  SHIPPED: 'bg-ember/20 text-ember',
  DELIVERED: 'bg-ink/10 text-ink/70',
  CANCELLED: 'bg-ember/10 text-ember',
  REFUNDED: 'bg-ink/10 text-ink/50',
};

export default async function AdminOrdersPage() {
  const orders = await safeApiFetch<Order[]>('/admin/orders/recent?limit=100', {
    forwardCookies: true,
  });
  if (!orders) return <p className="text-ember">Error carregant comandes.</p>;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl text-ink">Comandes ({orders.length})</h2>
      <div className="overflow-x-auto rounded-xl2 border border-ink/10 bg-cream">
        <table className="w-full text-sm">
          <thead className="border-b border-ink/10 bg-wax/40 text-left text-xs uppercase tracking-widest text-ink/60">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Estat</th>
              <th className="px-3 py-2">Unitats</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {orders.map((o) => {
              const units = o.items.reduce((s, i) => s + i.quantity, 0);
              return (
                <tr key={o.id}>
                  <td className="px-3 py-2 font-mono text-xs text-ink/70">
                    {o.id.slice(0, 10)}…
                  </td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${statusColor[o.status] ?? 'bg-ink/10 text-ink/70'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-ink/70">{units}</td>
                  <td className="px-3 py-2 font-mono text-ember">{formatEur(o.totalCents)}</td>
                  <td className="px-3 py-2 text-ink/70">
                    {new Date(o.createdAt).toLocaleDateString('ca-ES')}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link href={`/admin/orders/${o.id}`} className="text-sm text-ember hover:underline">
                      Obrir
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
