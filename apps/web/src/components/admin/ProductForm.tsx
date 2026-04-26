'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
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
  images?: { url: string; alt: string | null }[];
  modelUrl?: string | null;
  modelMeta?: { scale?: number; yOffset?: number; cameraFov?: number } | null;
};

function normalizeSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120);
}

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
  const [form, setForm] = useState<ProductInput>({
    ...initial,
    images: initial.images ?? [],
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [uploadingModel, setUploadingModel] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  useEffect(() => {
    if (form.categoryId || categories.length === 0) return;
    setForm((f) => ({ ...f, categoryId: categories[0].id }));
  }, [categories, form.categoryId]);

  async function uploadImage(file: File): Promise<string> {
    if (!file.type.startsWith('image/')) {
      throw new Error('Nomes imatges');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Maxim 10 MB per imatge');
    }
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`/api/admin-proxy/admin/uploads/image`, {
      method: 'POST',
      body: fd,
    });
    if (!res.ok) throw new Error(await res.text());
    const { url } = (await res.json()) as { url: string };
    return url;
  }

  async function uploadHeroImage(file: File) {
    setUploadingHero(true);
    setErr(null);
    try {
      const url = await uploadImage(file);
      setForm((f) => ({ ...f, heroImageUrl: url }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error pujant la portada');
    } finally {
      setUploadingHero(false);
    }
  }

  async function uploadGalleryImages(files: FileList) {
    setUploadingGallery(true);
    setErr(null);
    try {
      const uploaded: { url: string; alt: string | null }[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadImage(file);
        uploaded.push({ url, alt: null });
      }
      if (uploaded.length) {
        setForm((f) => ({ ...f, images: [...(f.images ?? []), ...uploaded] }));
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error pujant les imatges');
    } finally {
      setUploadingGallery(false);
    }
  }

  async function uploadModel(file: File) {
    setUploadingModel(true);
    setErr(null);
    try {
      if (!file.name.toLowerCase().endsWith('.glb')) {
        throw new Error('Nomes .glb');
      }
      if (file.size > 60 * 1024 * 1024) {
        throw new Error('Maxim 60 MB');
      }
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/admin-proxy/admin/uploads/model`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      const { url } = (await res.json()) as { url: string };
      setForm((f) => ({ ...f, modelUrl: url }));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error pujant el model');
    } finally {
      setUploadingModel(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const isUpdate = !!form.id;
      const url = isUpdate
        ? `/api/admin-proxy/admin/products/${form.id}`
        : `/api/admin-proxy/admin/products`;
      const payload = {
        slug: normalizeSlug(form.slug),
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
        images: (form.images ?? []).map((img) => ({ url: img.url, alt: img.alt })),
        modelUrl: form.modelUrl || null,
        modelMeta: form.modelMeta ?? null,
      };
      const res = await fetch(url, {
        method: isUpdate ? 'PATCH' : 'POST',
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
      await fetch(`/api/admin-proxy/admin/products/${form.id}`, {
        method: 'DELETE',
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
            onBlur={(e) => setForm((f) => ({ ...f, slug: normalizeSlug(e.target.value) }))}
            className={inputCls}
          />
          <p className="mt-1 text-xs text-ink/55">Nomes lletres minuscules, numeros i guions.</p>
        </Field>
        <Field label="Categoria">
          {categories.length > 0 ? (
            <div className="flex flex-wrap gap-3 pt-1">
              {categories.map((cat) => (
                <label
                  key={cat.id}
                  className={`flex min-w-[180px] flex-1 cursor-pointer items-center justify-center rounded-xl border py-2 text-sm transition ${
                    form.categoryId === cat.id
                      ? 'border-ember bg-ember/10 text-ember'
                      : 'border-ink/15 text-ink/70 hover:border-ink/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="categoryId"
                    required
                    className="sr-only"
                    value={cat.id}
                    checked={form.categoryId === cat.id}
                    onChange={() => setForm({ ...form, categoryId: cat.id })}
                  />
                  {cat.name}
                </label>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-ember/30 bg-ember/5 px-3 py-2 text-sm text-ember">
              No hi ha categories disponibles. Crea categories abans de crear productes.
            </p>
          )}
        </Field>
        <Field label="Preu base (centims)">
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
        <Field label="IVA (0-1)">
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

      <Field label="Descripcio curta">
        <input
          value={form.shortDescription}
          onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
          className={inputCls}
        />
      </Field>

      <Field label="Descripcio">
        <textarea
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className={inputCls}
        />
      </Field>

      <fieldset className="space-y-3 rounded-md border border-ink/10 p-3">
        <legend className="px-1 text-xs font-medium uppercase tracking-wider text-ink/60">
          Portada (1 imatge)
        </legend>
        <div className="flex items-center gap-3 text-sm">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadHeroImage(f);
            }}
            disabled={uploadingHero}
          />
          {uploadingHero && <span className="text-ink/60">Pujant...</span>}
        </div>
        {form.heroImageUrl ? (
          <div className="space-y-2 text-xs">
            <div className="h-28 w-28 overflow-hidden rounded-md bg-wax/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.heroImageUrl} alt="Portada" className="h-full w-full object-cover" />
            </div>
            <div className="flex items-center gap-3">
              <a
                href={form.heroImageUrl}
                target="_blank"
                rel="noreferrer"
                className="truncate text-ember underline"
              >
                Veure portada
              </a>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, heroImageUrl: null }))}
                className="text-ember/80 hover:text-ember"
              >
                Eliminar
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-ink/50">Sense portada.</p>
        )}
      </fieldset>

      <fieldset className="space-y-3 rounded-md border border-ink/10 p-3">
        <legend className="px-1 text-xs font-medium uppercase tracking-wider text-ink/60">
          Fotos del producte (galeria)
        </legend>
        <div className="flex items-center gap-3 text-sm">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) uploadGalleryImages(files);
            }}
            disabled={uploadingGallery}
          />
          {uploadingGallery && <span className="text-ink/60">Pujant...</span>}
        </div>
        {form.images && form.images.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {form.images.map((img, index) => (
              <div key={`${img.url}-${index}`} className="space-y-1">
                <div className="aspect-square overflow-hidden rounded-md bg-wax/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.alt ?? ''} className="h-full w-full object-cover" />
                </div>
                <button
                  type="button"
                  className="text-xs text-ember/80 hover:text-ember"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      images: (f.images ?? []).filter((_, i) => i !== index),
                    }))
                  }
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink/50">Sense fotos de galeria.</p>
        )}
      </fieldset>

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
            disabled={uploadingModel}
          />
          {uploadingModel && <span className="text-ink/60">Pujant...</span>}
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
            Sense model. El configurador usara el mode 2D.
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
          <Field label="Desplacament Y">
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
          {busy ? '...' : form.id ? 'Desa canvis' : 'Crear producte'}
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
