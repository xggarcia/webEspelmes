'use client';

import { useEffect, useState } from 'react';

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  _count: { products: number };
};

function slugify(s: string) {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const res = await fetch('/api/admin-proxy/admin/categories');
    if (res.ok) setCats(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/admin-proxy/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, description: '', sortOrder: cats.length }),
      });
      if (!res.ok) throw new Error(await res.text());
      setName('');
      setSlug('');
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, productCount: number) {
    if (productCount > 0) {
      alert(`Aquesta categoria té ${productCount} productes. Reasigna'ls primer.`);
      return;
    }
    if (!confirm('Eliminar categoria?')) return;
    await fetch(`/api/admin-proxy/admin/categories/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <div className="space-y-8">
      <h2 className="font-display text-xl text-ink">Categories</h2>

      {/* Existing */}
      <div className="divide-y divide-ink/[0.07] rounded-xl border border-ink/[0.08]">
        {cats.length === 0 && (
          <p className="px-4 py-6 text-sm text-ink/45">Sense categories encara.</p>
        )}
        {cats.map((cat) => (
          <div key={cat.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink">{cat.name}</p>
              <p className="text-xs text-ink/40">/{cat.slug} · {cat._count.products} productes</p>
            </div>
            <button
              onClick={() => remove(cat.id, cat._count.products)}
              className="text-xs text-ink/30 hover:text-ember transition-colors"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>

      {/* Create */}
      <form onSubmit={create} className="space-y-3 rounded-xl border border-ink/[0.08] p-4">
        <p className="text-sm font-medium text-ink">Nova categoria</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wider text-ink/50">Nom</span>
            <input
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSlug(slugify(e.target.value));
              }}
              placeholder="Espelmes"
              className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm focus:border-ember focus:outline-none"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wider text-ink/50">Slug</span>
            <input
              required
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="espelmes"
              className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-mono focus:border-ember focus:outline-none"
            />
          </label>
        </div>
        {err && <p className="text-xs text-ember">{err}</p>}
        <button
          type="submit"
          disabled={busy}
          className="btn-primary disabled:opacity-50"
        >
          {busy ? '...' : 'Crear categoria'}
        </button>
      </form>
    </div>
  );
}
