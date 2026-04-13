'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { API_BASE } from '@/lib/api';

type Labels = {
  name?: string;
  email: string;
  password: string;
  submit: string;
  invalid: string;
  unexpected: string;
};

export function AuthForm({ mode, labels }: { mode: 'login' | 'register'; labels: Labels }) {
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const body =
        mode === 'register'
          ? { email: form.email, password: form.password, name: form.name }
          : { email: form.email, password: form.password };
      const res = await fetch(`${API_BASE}/auth/${mode}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setErr(res.status === 401 ? labels.invalid : labels.unexpected);
        return;
      }
      router.push('/compte');
      router.refresh();
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
      {mode === 'register' && labels.name && (
        <label className="block text-sm">
          <span className="text-ink/70">{labels.name}</span>
          <input
            required
            minLength={1}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputCls}
          />
        </label>
      )}
      <label className="block text-sm">
        <span className="text-ink/70">{labels.email}</span>
        <input
          required
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={inputCls}
        />
      </label>
      <label className="block text-sm">
        <span className="text-ink/70">{labels.password}</span>
        <input
          required
          type="password"
          minLength={mode === 'register' ? 10 : 1}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className={inputCls}
        />
      </label>
      {err && <p className="text-sm text-ember">{err}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
        {loading ? '…' : labels.submit}
      </button>
    </form>
  );
}
