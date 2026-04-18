'use client';

import { useState } from 'react';
import { API_BASE } from '@/lib/api';

type Labels = {
  current: string;
  new: string;
  save: string;
  saved: string;
  wrongPassword: string;
  error: string;
};

export function ChangePasswordForm({ labels }: { labels: Labels }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    setErr(null);
    try {
      const res = await fetch(`${API_BASE}/users/me/password`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.status === 401) { setErr(labels.wrongPassword); return; }
      if (!res.ok) { setErr(labels.error); return; }
      setSaved(true);
      setForm({ currentPassword: '', newPassword: '' });
    } catch {
      setErr(labels.error);
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    'mt-1 w-full rounded-md border border-ink/15 bg-cream px-3 py-2 text-ink outline-none focus:border-ember text-sm';

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm">
        <span className="text-ink/70">{labels.current}</span>
        <input required type="password" value={form.currentPassword}
          onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} className={inputCls} />
      </label>
      <label className="block text-sm">
        <span className="text-ink/70">{labels.new}</span>
        <input required type="password" minLength={10}
          value={form.newPassword}
          onChange={(e) => setForm({ ...form, newPassword: e.target.value })} className={inputCls} />
      </label>
      {err && <p className="text-sm text-ember">{err}</p>}
      {saved && <p className="text-sm text-sage">{labels.saved}</p>}
      <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
        {loading ? '…' : labels.save}
      </button>
    </form>
  );
}
