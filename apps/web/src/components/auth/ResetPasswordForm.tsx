'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { API_BASE } from '@/lib/api';

type Labels = {
  newPassword: string;
  submit: string;
  invalid: string;
  unexpected: string;
};

export function ResetPasswordForm({ token, labels }: { token: string; labels: Labels }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${API_BASE}/auth/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (res.status === 400) { setErr(labels.invalid); return; }
      if (!res.ok) { setErr(labels.unexpected); return; }
      router.push('/auth/login?reset=1');
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
        <span className="text-ink/70">{labels.newPassword}</span>
        <input required type="password" minLength={10} value={password}
          onChange={(e) => setPassword(e.target.value)} className={inputCls} />
      </label>
      {err && <p className="text-sm text-ember">{err}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
        {loading ? '…' : labels.submit}
      </button>
    </form>
  );
}
