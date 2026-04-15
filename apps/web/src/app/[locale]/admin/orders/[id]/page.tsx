import { notFound } from 'next/navigation';
import { safeApiFetch } from '@/lib/api-server';
import { formatEur } from '@/lib/currency';
import { OrderStatusControl } from '@/components/admin/OrderStatusControl';

type OrderDetail = {
  id: string;
  status: string;
  totalCents: number;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  createdAt: string;
  email: string | null;
  notes: string | null;
  userId: string | null;
  shippingAddress: Record<string, string> | null;
  items: {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
    customization: unknown;
  }[];
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await safeApiFetch<OrderDetail>(`/orders/${id}`, { forwardCookies: true });
  if (!order) notFound();

  const addr = order.shippingAddress;

  return (
    <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <div className="card-warm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-ink/50">Comanda</p>
              <p className="font-mono text-sm text-ink/70">{order.id}</p>
            </div>
            <span className="rounded-full bg-ink/10 px-3 py-1 text-sm text-ink">{order.status}</span>
          </div>
          <p className="mt-2 text-xs text-ink/50">
            {new Date(order.createdAt).toLocaleString('ca-ES')}
          </p>
        </div>

        <div className="card-warm space-y-2">
          <h3 className="font-display text-lg text-ink">Articles</h3>
          <ul className="divide-y divide-ink/10">
            {order.items.map((it) => (
              <li key={it.id} className="py-2">
                <div className="flex justify-between text-sm">
                  <span className="text-ink">
                    {it.productName} <span className="text-ink/50">× {it.quantity}</span>
                  </span>
                  <span className="font-mono text-ember">{formatEur(it.totalCents)}</span>
                </div>
                {it.customization != null && (
                  <details className="mt-1">
                    <summary className="cursor-pointer text-xs text-ink/50">
                      Personalització
                    </summary>
                    <pre className="mt-1 overflow-auto rounded bg-ink/5 p-2 text-[10px] text-ink/70">
                      {JSON.stringify(it.customization, null, 2)}
                    </pre>
                  </details>
                )}
              </li>
            ))}
          </ul>
          <div className="space-y-1 border-t border-ink/10 pt-2 text-sm">
            <Row label="Subtotal" value={formatEur(order.subtotalCents)} />
            <Row label="Enviament" value={formatEur(order.shippingCents)} />
            <Row label="IVA" value={formatEur(order.taxCents)} />
            <Row label="Total" value={formatEur(order.totalCents)} bold />
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="card-warm space-y-2">
          <h3 className="font-display text-lg text-ink">Enviament</h3>
          {addr ? (
            <address className="not-italic text-sm text-ink/80">
              {addr.fullName}
              <br />
              {addr.street}
              <br />
              {addr.postalCode} {addr.city}
              <br />
              {addr.country}
            </address>
          ) : (
            <p className="text-sm text-ink/50">Sense adreça.</p>
          )}
          {order.email && <p className="text-xs text-ink/60">{order.email}</p>}
          {order.notes && <p className="text-xs italic text-ink/60">«{order.notes}»</p>}
        </div>

        <div className="card-warm space-y-2">
          <h3 className="font-display text-lg text-ink">Transicions</h3>
          <OrderStatusControl id={order.id} current={order.status} />
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-display text-ink' : 'text-ink/70'}`}>
      <span>{label}</span>
      <span className="font-mono text-ember">{value}</span>
    </div>
  );
}
