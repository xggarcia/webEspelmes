'use client';

import { useState } from 'react';
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
  stripeDev: string;
};

export function CheckoutForm({ defaultEmail, labels }: { defaultEmail: string; labels: Labels }) {
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
  const router = useRouter();

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
      const data = (await res.json()) as {
        orderId: string;
        stripeConfigured: boolean;
      };
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

  const inputCls =
    'mt-1 w-full rounded-md border border-ink/15 bg-cream px-3 py-2 text-ink outline-none focus:border-ember';

  return (
    <form onSubmit={submit} className="card-warm space-y-4">
      <label className="block text-sm">
        <span className="text-ink/70">{labels.email}</span>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="block text-sm">
        <span className="text-ink/70">{labels.fullName}</span>
        <input
          required
          minLength={2}
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="block text-sm">
        <span className="text-ink/70">{labels.street}</span>
        <input
          required
          minLength={3}
          value={form.street}
          onChange={(e) => setForm({ ...form, street: e.target.value })}
          className={inputCls}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-ink/70">{labels.city}</span>
          <input
            required
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="block text-sm">
          <span className="text-ink/70">{labels.postalCode}</span>
          <input
            required
            value={form.postalCode}
            onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
            className={inputCls}
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-ink/70">{labels.country}</span>
        <input
          required
          maxLength={2}
          value={form.country}
          onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })}
          className={inputCls}
        />
      </label>
      <label className="block text-sm">
        <span className="text-ink/70">{labels.notes}</span>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className={inputCls}
        />
      </label>
      {info && <p className="text-sm text-sage">{info}</p>}
      {err && <p className="text-sm text-ember">{err}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
        {loading ? '…' : labels.pay}
      </button>
    </form>
  );
}
