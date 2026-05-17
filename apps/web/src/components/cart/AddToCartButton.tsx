'use client';

import { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/routing';
import { API_BASE } from '@/lib/api';

type Customization = Record<string, unknown> | null;

export function AddToCartButton({
  productId,
  disabled,
  label,
  customization,
}: {
  productId: string;
  disabled?: boolean;
  label: string;
  customization?: Customization;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  function add() {
    setErr(null);
    start(async () => {
      try {
        const body: Record<string, unknown> = { productId, quantity: 1 };
        if (customization) body.customization = customization;
        const res = await fetch(`${API_BASE}/cart/items`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
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
        {pending ? '…' : label}
      </button>
      {err && <p className="text-xs text-ember">{err}</p>}
    </div>
  );
}

