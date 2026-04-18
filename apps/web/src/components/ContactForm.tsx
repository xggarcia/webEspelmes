'use client';

import { useState } from 'react';
import { API_BASE } from '@/lib/api';

type Labels = {
  name: string;
  email: string;
  message: string;
  send: string;
  thanks: string;
  error: string;
};

export function ContactForm({ labels }: { labels: Labels }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (sent) {
    return <p className="card-warm text-sage">{labels.thanks}</p>;
  }

  const inputCls =
    'mt-1 w-full rounded-md border border-ink/15 bg-cream px-3 py-2 text-ink outline-none focus:border-ember';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setErr(labels.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-warm space-y-4">
      <label className="block text-sm">
        <span className="text-ink/70">{labels.name}</span>
        <input
          required
          className={inputCls}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </label>
      <label className="block text-sm">
        <span className="text-ink/70">{labels.email}</span>
        <input
          required
          type="email"
          className={inputCls}
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
      </label>
      <label className="block text-sm">
        <span className="text-ink/70">{labels.message}</span>
        <textarea
          required
          rows={5}
          className={inputCls}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
        />
      </label>
      {err && <p className="text-sm text-ember">{err}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
        {loading ? '…' : labels.send}
      </button>
    </form>
  );
}
