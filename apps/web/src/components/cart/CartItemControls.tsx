'use client';

import { useTransition } from 'react';
import { useRouter } from '@/i18n/routing';
import { API_BASE } from '@/lib/api';

export function CartItemControls({
  itemId,
  quantity,
  removeLabel,
}: {
  itemId: string;
  quantity: number;
  removeLabel: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function call(method: 'PATCH' | 'DELETE', body?: unknown) {
    start(async () => {
      await fetch(`${API_BASE}/cart/items/${itemId}`, {
        method,
        credentials: 'include',
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        type="button"
        onClick={() => call('PATCH', { quantity: Math.max(1, quantity - 1) })}
        disabled={pending || quantity <= 1}
        className="h-7 w-7 rounded-md border border-ink/10 hover:bg-wax/60 disabled:opacity-40"
        aria-label="âˆ’"
      >
        âˆ’
      </button>
      <span className="w-6 text-center">{quantity}</span>
      <button
        type="button"
        onClick={() => call('PATCH', { quantity: quantity + 1 })}
        disabled={pending}
        className="h-7 w-7 rounded-md border border-ink/10 hover:bg-wax/60 disabled:opacity-40"
        aria-label="+"
      >
        +
      </button>
      <button
        type="button"
        onClick={() => call('DELETE')}
        disabled={pending}
        className="ml-2 text-xs text-ink/60 hover:text-ember"
      >
        {removeLabel}
      </button>
    </div>
  );
}

