'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { API_BASE } from '@/lib/api';
import { OptionsEditor } from './OptionsEditor';

type Category = { id: string; name: string; slug: string };
type OptionValue = {
  id: string;
  code: string;
  label: string;
  priceDeltaCents: number;
  meta: Record<string, unknown> | null;
  sortOrder: number;
};
type ProductOption = {
  id: string;
  kind: 'color' | 'size' | 'finish' | 'shape' | 'platform' | 'label' | 'accessory';
  label: string;
  required: boolean;
  sortOrder: number;
  values: OptionValue[];
};
type ProductInput = {
  id?: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  basePriceCents: number;
  stock: number;
  categoryId: string;
  isCustomizable: boolean;
  isActive: boolean;
  vatRate: number;
  heroImageUrl: string | null;
  modelUrl?: string | null;
  modelMeta?: { scale?: number; yOffset?: number; cameraFov?: number } | null;
};

export function ProductForm({
  categories,
  initial,
  initialOptions = [],
}: {
  categories: Category[];
  initial: ProductInput;
  initialOptions?: ProductOption[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function uploadModel(file: File) {
    setUploading(true);
    setErr(null);
    try {
      if (!file.name.toLowerCase().endsWith('.glb')) {
        throw new Error('Només .glb');
      }
      if (file.size > 60 * 1024 * 1024) {
        throw new Error('Màxim 60 MB');
      }
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_BASE}/admin/uploads/model`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      const { url } = (await res.json()) as { url: string };
      setForm((f) => ({ ...f, modelUrl: url }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error pujant el model');
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const isUpdate = !!form.id;
      const url = isUpdate
        ? `${API_BASE}/admin/products/${form.id}`
        : `${API_BASE}/admin/products`;
      const payload = {
        slug: form.slug,
        name: form.name,
        shortDescription: form.shortDescription,
        description: form.description,
        basePriceCents: Number(form.basePriceCents),
        stock: Number(form.stock),
        categoryId: form.categoryId,
        isCustomizable: form.isCustomizable,
        isActive: form.isActive,
        vatRate: Number(form.vatRate),
        heroImageUrl: form.heroImageUrl || null,
        modelUrl: form.modelUrl || null,
        modelMeta: form.modelMeta ?? null,
      };
      const res = await fetch(url, {
        method: isUpdate ? 'PATCH' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      if (isUpdate) {
        router.push('/admin/products');
      } else {
        const created = (await res.json()) as { id: string };
        router.push(`/admin/products/${created.id}`);
      }
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function deactivate() {
    if (!form.id) return;
    if (!confirm('Desactivar aquest producte?')) return;
    setBusy(true);
    try {
      await fetch(`${API_BASE}/admin/products/${form.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      router.push('/admin/products');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nom">
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Slug">
          <input
            required
            pattern="[a-z0-9-]+"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Categoria">
          <select
            required
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className={inputCls}
          >
            <option value="">— Escull —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Preu base (cèntims)">
          <input
            type="number"
            min={0}
            required
            value={form.basePriceCents}
            onChange={(e) => setForm({ ...form, basePriceCents: +e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="Estoc">
          <input
            type="number"
            min={0}
            required
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: +e.target.value })}
            className={inputCls}
          />
        </Field>
        <Field label="IVA (0–1)">
          <input
            type="number"
            step="0.01"
            min={0}
            max={1}
            value={form.vatRate}
            onChange={(e) => setForm({ ...form, vatRate: +e.target.value })}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Descripció curta">
        <input
          value={form.shortDescription}
          onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
          className={inputCls}
        />
      </Field>

      <Field label="Descripció">
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={inputCls}
        />
      </Field>

      <Field label="URL imatge hero">
        <input
          type="url"
          value={form.heroImageUrl ?? ''}
          onChange={(e) => setForm({ ...form, heroImageUrl: e.target.value })}
          className={inputCls}
        />
      </Field>

      <fieldset className="space-y-3 rounded-md border border-ink/10 p-3">
        <legend className="px-1 text-xs font-medium uppercase tracking-wider text-ink/60">
          Model 3D (.glb)
        </legend>
        <div className="flex items-center gap-3 text-sm">
          <input
            type="file"
            accept=".glb,model/gltf-binary"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadModel(f);
            }}
            disabled={uploading}
          />
          {uploading && <span className="text-ink/60">Pujant…</span>}
        </div>
        {form.modelUrl ? (
          <div className="flex items-center gap-3 text-xs">
            <a
              href={form.modelUrl}
              target="_blank"
              rel="noreferrer"
              className="truncate text-ember underline"
            >
              {form.modelUrl}
            </a>
            <button
              type="button"
              onClick={() => setForm({ ...form, modelUrl: null })}
              className="text-ember/80 hover:text-ember"
            >
              Eliminar
            </button>
          </div>
        ) : (
          <p className="text-xs text-ink/50">
            Sense model. El configurador usarà el mode 2D.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Escala">
            <input
              type="number"
              step="0.1"
              min={0.1}
              value={form.modelMeta?.scale ?? 1}
              onChange={(e) =>
                setForm({
                  ...form,
                  modelMeta: { ...(form.modelMeta ?? {}), scale: +e.target.value },
                })
              }
              className={inputCls}
            />
          </Field>
          <Field label="Desplaçament Y">
            <input
              type="number"
              step="0.05"
              value={form.modelMeta?.yOffset ?? 0}
              onChange={(e) =>
                setForm({
                  ...form,
                  modelMeta: { ...(form.modelMeta ?? {}), yOffset: +e.target.value },
                })
              }
              className={inputCls}
            />
          </Field>
        </div>
      </fieldset>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isCustomizable}
            onChange={(e) => setForm({ ...form, isCustomizable: e.target.checked })}
          />
          Personalitzable
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Actiu
        </label>
      </div>

      {form.isCustomizable && form.id && (
        <div className="rounded-md border border-ink/10 p-4">
          <OptionsEditor productId={form.id} initial={initialOptions} />
        </div>
      )}

      {err && <p className="text-sm text-ember">{err}</p>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
          {busy ? '…' : form.id ? 'Desa canvis' : 'Crear producte'}
        </button>
        {form.id && (
          <button type="button" onClick={deactivate} disabled={busy} className="btn-ghost text-ember">
            Desactivar
          </button>
        )}
      </div>
    </form>
  );
}

const inputCls =
  'w-full rounded-md border border-ink/15 bg-cream px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium uppercase tracking-wider text-ink/60">{label}</span>
      {children}
    </label>
  );
}
