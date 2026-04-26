import { adminFetch as safeApiFetch } from '@/lib/api-admin';

type Customer = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  _count: { orders: number };
};

export default async function AdminCustomersPage() {
  const customers = await safeApiFetch<Customer[]>('/admin/customers?limit=200');
  if (!customers) return <p className="text-ember">Error carregant clients.</p>;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl text-ink">Clients ({customers.length})</h2>
      <div className="overflow-x-auto rounded-xl2 border border-ink/10 bg-cream">
        <table className="w-full text-sm">
          <thead className="border-b border-ink/10 bg-wax/40 text-left text-xs uppercase tracking-widest text-ink/60">
            <tr>
              <th className="px-3 py-2">Nom</th>
              <th className="px-3 py-2">Correu</th>
              <th className="px-3 py-2">Comandes</th>
              <th className="px-3 py-2">Alta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {customers.map((c) => (
              <tr key={c.id}>
                <td className="px-3 py-2 text-ink">{c.name ?? '—'}</td>
                <td className="px-3 py-2 font-mono text-xs text-ink/70">{c.email}</td>
                <td className="px-3 py-2 text-ink/70">{c._count.orders}</td>
                <td className="px-3 py-2 text-ink/70">
                  {new Date(c.createdAt).toLocaleDateString('ca-ES')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
