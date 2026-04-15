'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { API_BASE } from '@/lib/api';

const TRANSITIONS: Record<string, string[]> = {
  PENDING: ['PAID', 'CANCELLED'],
  PAID: ['FULFILLED', 'REFUNDED'],
  FULFILLED: ['SHIPPED', 'REFUNDED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
};

export function OrderStatusControl({ id, current }: { id: string; current: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const options = TRANSITIONS[current] ?? [];
  if (options.length === 0) {
    return <p className="text-xs text-ink/50">Sense transicions disponibles.</p>;
  }

  async function go(next: string) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`${API_BASE}/orders/${id}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next, reason: reason || undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="Motiu (opcional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full rounded-md border border-ink/15 bg-cream px-2 py-1 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        {options.map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy}
            onClick={() => go(s)}
            className="rounded-md bg-ink px-3 py-1.5 text-sm text-cream hover:bg-ember disabled:opacity-50"
          >
            → {s}
          </button>
        ))}
      </div>
      {err && <p className="text-xs text-ember">{err}</p>}
    </div>
  );
}
