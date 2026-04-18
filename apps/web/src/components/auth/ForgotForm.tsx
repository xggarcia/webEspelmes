'use client';

import { useState } from 'react';
import { API_BASE } from '@/lib/api';

type Labels = {
  email: string;
  submit: string;
  sent: string;
  unexpected: string;
};

export function ForgotForm({ labels }: { labels: Labels }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (sent) {
    return <p className="card-warm text-sage text-sm">{labels.sent}</p>;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      await fetch(`${API_BASE}/auth/forgot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setErr(labels.unexpected);
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
        <input required type="email" value={email}
          onChange={(e) => setEmail(e.target.value)} className={inputCls} />
      </label>
      {err && <p className="text-sm text-ember">{err}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
        {loading ? '…' : labels.submit}
      </button>
    </form>
  );
}
