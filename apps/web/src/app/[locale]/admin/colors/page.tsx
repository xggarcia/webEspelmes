'use client';

import { useEffect, useState } from 'react';

type Color = { id: string; name: string; hex: string; sortOrder: number };

function normalizeHex(v: string) {
  const s = v.startsWith('#') ? v : '#' + v;
  return s.toUpperCase().slice(0, 7);
}

export default function ColorsPage() {
  const [colors, setColors] = useState<Color[]>([]);
  const [name, setName] = useState('');
  const [hex, setHex] = useState('#C8A882');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/admin-proxy/admin/colors');
    if (res.ok) setColors(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/admin-proxy/admin/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, hex, sortOrder: colors.length }),
      });
      if (!res.ok) throw new Error(await res.text());
      setName('');
      setHex('#C8A882');
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Eliminar color?')) return;
    await fetch(`/api/admin-proxy/admin/colors/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div className="space-y-8">
      <h2 className="font-display text-xl text-ink">Colors disponibles</h2>

      <div className="divide-y divide-ink/[0.07] rounded-xl border border-ink/[0.08]">
        {colors.length === 0 && (
          <p className="px-4 py-6 text-sm text-ink/45">
            Sense colors encara. Afegeix colors per poder-los assignar als productes.
          </p>
        )}
        {colors.map((c) => (
          <div key={c.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span
                className="h-7 w-7 flex-shrink-0 rounded-full border border-ink/10 shadow-sm"
                style={{ background: c.hex }}
              />
              <div>
                <p className="text-sm font-medium text-ink">{c.name}</p>
                <p className="font-mono text-xs text-ink/40">{c.hex}</p>
              </div>
            </div>
            <button
              onClick={() => remove(c.id)}
              className="text-xs text-ink/30 transition-colors hover:text-ember"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={create} className="space-y-4 rounded-xl border border-ink/[0.08] p-4">
        <p className="text-sm font-medium text-ink">Nou color</p>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wider text-ink/50">Nom del color</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vainilla natural"
              className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm focus:border-ember focus:outline-none"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wider text-ink/50">Color</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={hex}
                onChange={(e) => setHex(normalizeHex(e.target.value))}
                className="h-10 w-10 cursor-pointer rounded border border-ink/15 bg-white p-0.5"
              />
              <input
                required
                pattern="^#[0-9A-Fa-f]{6}$"
                value={hex}
                onChange={(e) => setHex(normalizeHex(e.target.value))}
                placeholder="#C8A882"
                maxLength={7}
                className="w-28 rounded-lg border border-ink/15 bg-white px-3 py-2 font-mono text-sm focus:border-ember focus:outline-none"
              />
            </div>
          </label>
        </div>
        {err && <p className="text-xs text-ember">{err}</p>}
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
          {busy ? '...' : 'Afegir color'}
        </button>
      </form>
    </div>
  );
}
