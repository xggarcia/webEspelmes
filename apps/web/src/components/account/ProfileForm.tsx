'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { API_BASE } from '@/lib/api';

type Labels = {
  name: string;
  email: string;
  save: string;
  saved: string;
  emailTaken: string;
  error: string;
};

export function ProfileForm({
  initialName,
  initialEmail,
  labels,
}: {
  initialName: string;
  initialEmail: string;
  labels: Labels;
}) {
  const [form, setForm] = useState({ name: initialName, email: initialEmail });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    setErr(null);
    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.status === 409) { setErr(labels.emailTaken); return; }
      if (!res.ok) { setErr(labels.error); return; }
      setSaved(true);
      router.refresh();
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
        <span className="text-ink/70">{labels.name}</span>
        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
      </label>
      <label className="block text-sm">
        <span className="text-ink/70">{labels.email}</span>
        <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
      </label>
      {err && <p className="text-sm text-ember">{err}</p>}
      {saved && <p className="text-sm text-sage">{labels.saved}</p>}
      <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
        {loading ? '…' : labels.save}
      </button>
    </form>
  );
}
