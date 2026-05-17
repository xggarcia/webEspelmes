'use client';

import { useEffect, useState } from 'react';

type Scent = { id: string; nameEs: string; nameCa: string; sortOrder: number };

export default function ScentsPage() {
  const [scents, setScents] = useState<Scent[]>([]);
  const [nameEs, setNameEs] = useState('');
  const [nameCa, setNameCa] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/admin-proxy/admin/scents');
    if (res.ok) setScents(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/admin-proxy/admin/scents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameEs, nameCa, sortOrder: scents.length }),
      });
      if (!res.ok) throw new Error(await res.text());
      setNameEs('');
      setNameCa('');
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Eliminar aroma?')) return;
    await fetch(`/api/admin-proxy/admin/scents/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div className="space-y-8">
      <h2 className="font-display text-xl text-ink">Aromes disponibles</h2>

      <div className="divide-y divide-ink/[0.07] rounded-xl border border-ink/[0.08]">
        {scents.length === 0 && (
          <p className="px-4 py-6 text-sm text-ink/45">
            Sense aromes encara. Afegeix aromes per poder-les assignar als productes.
          </p>
        )}
        {scents.map((s) => (
          <div key={s.id} className="flex items-center justify-between px-4 py-3">
            <div className="grid grid-cols-[1fr_1fr] gap-6">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-ink/35">Castellà</p>
                <p className="text-sm font-medium text-ink">{s.nameEs}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-ink/35">Català</p>
                <p className="text-sm font-medium text-ink">{s.nameCa}</p>
              </div>
            </div>
            <button
              onClick={() => remove(s.id)}
              className="ml-4 flex-shrink-0 text-xs text-ink/30 transition-colors hover:text-ember"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={create} className="space-y-4 rounded-xl border border-ink/[0.08] p-4">
        <p className="text-sm font-medium text-ink">Nova aroma</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wider text-ink/50">Nom en castellà</span>
            <input
              required
              value={nameEs}
              onChange={(e) => setNameEs(e.target.value)}
              placeholder="Vainilla"
              className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm focus:border-ember focus:outline-none"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wider text-ink/50">Nom en català</span>
            <input
              required
              value={nameCa}
              onChange={(e) => setNameCa(e.target.value)}
              placeholder="Vainilla"
              className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm focus:border-ember focus:outline-none"
            />
          </label>
        </div>
        {err && <p className="text-xs text-ember">{err}</p>}
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
          {busy ? '...' : 'Afegir aroma'}
        </button>
      </form>
    </div>
  );
}
