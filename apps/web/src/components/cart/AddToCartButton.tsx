'use client';

import { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/routing';
import { API_BASE } from '@/lib/api';

export function AddToCartButton({
  productId,
  disabled,
  label,
}: {
  productId: string;
  disabled?: boolean;
  label: string;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  function add() {
    setErr(null);
    start(async () => {
      try {
        const res = await fetch(`${API_BASE}/cart/items`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, quantity: 1 }),
        });
        if (!res.ok) throw new Error(await res.text());
        router.push('/cistell');
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Error');
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={add}
        disabled={disabled || pending}
        className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'â€¦' : label}
      </button>
      {err && <p className="text-xs text-ember">{err}</p>}
    </div>
  );
}

