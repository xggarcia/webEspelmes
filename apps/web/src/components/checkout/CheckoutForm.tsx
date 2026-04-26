'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { API_BASE } from '@/lib/api';

type Labels = {
  email: string;
  fullName: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  notes: string;
  pay: string;
  subtotal: string;
  shipping: string;
  total: string;
  shippingCalculating: string;
  stripeDev: string;
};

export function CheckoutForm({ defaultEmail, cartSubtotalCents, labels }: {
  defaultEmail: string;
  cartSubtotalCents?: number;
  labels: Labels;
}) {
  const [form, setForm] = useState({
    email: defaultEmail,
    fullName: '',
    street: '',
    city: '',
    postalCode: '',
    country: 'ES',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [shippingCents, setShippingCents] = useState<number | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (form.postalCode.length !== 5) {
      setShippingCents(null);
      return;
    }
    setShippingLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/orders/shipping-estimate?postalCode=${form.postalCode}`);
        if (res.ok) {
          const data = (await res.json()) as { shippingCents: number };
          setShippingCents(data.shippingCents);
        }
      } finally {
        setShippingLoading(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [form.postalCode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/payments/checkout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          notes: form.notes,
          shipping: {
            fullName: form.fullName,
            street: form.street,
            city: form.city,
            postalCode: form.postalCode,
            country: form.country,
          },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { orderId: string; stripeConfigured: boolean };
      if (!data.stripeConfigured) {
        setInfo(labels.stripeDev);
        await fetch(`${API_BASE}/payments/dev/mark-paid/${data.orderId}`, {
          method: 'POST',
          credentials: 'include',
        });
      }
      router.push('/checkout/exit');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  const fmt = (cents: number) =>
    new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100);

  const inputCls =
    'mt-1 w-full rounded-md border border-ink/15 bg-cream px-3 py-2 text-ink outline-none focus:border-ember';

  return (
    <form onSubmit={submit} className="card p-5 space-y-4">
      <label className="block text-sm">
        <span className="text-ink/70">{labels.email}</span>
        <input type="email" required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
      </label>
      <label className="block text-sm">
        <span className="text-ink/70">{labels.fullName}</span>
        <input required minLength={2} value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputCls} />
      </label>
      <label className="block text-sm">
        <span className="text-ink/70">{labels.street}</span>
        <input required minLength={3} value={form.street}
          onChange={(e) => setForm({ ...form, street: e.target.value })} className={inputCls} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-ink/70">{labels.city}</span>
          <input required value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputCls} />
        </label>
        <label className="block text-sm">
          <span className="text-ink/70">{labels.postalCode}</span>
          <input required value={form.postalCode}
            onChange={(e) => setForm({ ...form, postalCode: e.target.value })} className={inputCls} />
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-ink/70">{labels.country}</span>
        <input required maxLength={2} value={form.country}
          onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })} className={inputCls} />
      </label>
      <label className="block text-sm">
        <span className="text-ink/70">{labels.notes}</span>
        <textarea rows={3} value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} />
      </label>

      {/* Order summary */}
      {(cartSubtotalCents !== undefined || shippingCents !== null || shippingLoading) && (
        <div className="border-t border-ink/10 pt-3 space-y-1 text-sm">
          {cartSubtotalCents !== undefined && (
            <div className="flex justify-between">
              <span className="text-ink/70">{labels.subtotal}</span>
              <span>{fmt(cartSubtotalCents)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-ink/70">{labels.shipping}</span>
            <span>
              {shippingLoading
                ? labels.shippingCalculating
                : shippingCents !== null
                  ? fmt(shippingCents)
                  : '"”'}
            </span>
          </div>
          {cartSubtotalCents !== undefined && shippingCents !== null && (
            <div className="flex justify-between font-semibold border-t border-ink/10 pt-1 mt-1">
              <span>{labels.total}</span>
              <span>{fmt(cartSubtotalCents + shippingCents)}</span>
            </div>
          )}
        </div>
      )}

      {info && <p className="text-sm text-sage">{info}</p>}
      {err && <p className="text-sm text-ember">{err}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
        {loading ? '…' : labels.pay}
      </button>
    </form>
  );
}

