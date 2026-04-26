'use client';

import { useState } from 'react';
import { API_BASE } from '@/lib/api';

const OPTION_KINDS = [
  { value: 'color', label: 'Color' },
  { value: 'size', label: 'Mida' },
  { value: 'finish', label: 'Acabat' },
  { value: 'shape', label: 'Forma' },
  { value: 'platform', label: 'Base / plataforma' },
  { value: 'accessory', label: 'Accessori' },
  { value: 'label', label: 'Etiqueta / text' },
] as const;

type OptionKind = (typeof OPTION_KINDS)[number]['value'];

type OptionValue = {
  id: string;
  code: string;
  label: string;
  priceDeltaCents: number;
  meta: Record<string, unknown> | null;
  sortOrder: number;
};

type Option = {
  id: string;
  kind: OptionKind;
  label: string;
  required: boolean;
  sortOrder: number;
  values: OptionValue[];
};

const inputCls =
  'w-full rounded-md border border-ink/15 bg-cream px-3 py-2 text-sm text-ink focus:border-ember focus:outline-none';

async function apiFetch(url: string, options: RequestInit) {
  const res = await fetch(url, {  ...options });
  if (!res.ok && res.status !== 204) throw new Error(await res.text());
  if (res.status === 204) return null;
  return res.json();
}

export function OptionsEditor({
  productId,
  initial,
}: {
  productId: string;
  initial: Option[];
}) {
  const [options, setOptions] = useState<Option[]>(initial);
  const [err, setErr] = useState<string | null>(null);

  // â”€â”€ Add option group â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [newKind, setNewKind] = useState<OptionKind>('color');
  const [newLabel, setNewLabel] = useState('');
  const [addingGroup, setAddingGroup] = useState(false);

  async function addOptionGroup() {
    setErr(null);
    setAddingGroup(true);
    try {
      const opt = await apiFetch(`/api/admin-proxy/admin/products/${productId}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: newKind, label: newLabel || OPTION_KINDS.find(k => k.value === newKind)!.label }),
      }) as Option;
      setOptions((prev) => [...prev, opt]);
      setNewLabel('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setAddingGroup(false);
    }
  }

  async function removeOptionGroup(optionId: string) {
    if (!confirm('Eliminar aquest grup d\'opcions i tots els seus valors?')) return;
    setErr(null);
    try {
      await apiFetch(`/api/admin-proxy/admin/products/${productId}/options/${optionId}`, { method: 'DELETE' });
      setOptions((prev) => prev.filter((o) => o.id !== optionId));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
    }
  }

  async function addValue(optionId: string, draft: Omit<OptionValue, 'id'>) {
    setErr(null);
    try {
      const val = await apiFetch(
        `/api/admin-proxy/admin/products/${productId}/options/${optionId}/values`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draft),
        },
      ) as OptionValue;
      setOptions((prev) =>
        prev.map((o) => (o.id === optionId ? { ...o, values: [...o.values, val] } : o)),
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
    }
  }

  async function removeValue(optionId: string, valueId: string) {
    setErr(null);
    try {
      await apiFetch(
        `/api/admin-proxy/admin/products/${productId}/options/${optionId}/values/${valueId}`,
        { method: 'DELETE' },
      );
      setOptions((prev) =>
        prev.map((o) =>
          o.id === optionId ? { ...o, values: o.values.filter((v) => v.id !== valueId) } : o,
        ),
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xs font-medium uppercase tracking-wider text-ink/60">
        Opcions de personalitzaciÃ³
      </h3>

      {options.map((opt) => (
        <OptionGroup
          key={opt.id}
          option={opt}
          onAddValue={(draft) => addValue(opt.id, draft)}
          onRemoveValue={(valueId) => removeValue(opt.id, valueId)}
          onRemoveGroup={() => removeOptionGroup(opt.id)}
        />
      ))}

      {/* Add new option group */}
      <fieldset className="space-y-3 rounded-md border border-dashed border-ink/20 p-3">
        <legend className="px-1 text-xs text-ink/50">+ Nou grup d&apos;opcions</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs font-medium uppercase tracking-wider text-ink/60">Tipus</span>
            <select
              value={newKind}
              onChange={(e) => setNewKind(e.target.value as OptionKind)}
              className={inputCls}
            >
              {OPTION_KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-medium uppercase tracking-wider text-ink/60">
              Etiqueta (opcional)
            </span>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Ex: Tria el color"
              className={inputCls}
            />
          </label>
        </div>
        <button
          type="button"
          onClick={addOptionGroup}
          disabled={addingGroup}
          className="btn-primary disabled:opacity-50"
        >
          {addingGroup ? 'â€¦' : 'Afegir grup'}
        </button>
      </fieldset>

      {err && <p className="text-sm text-ember">{err}</p>}
    </div>
  );
}

// â”€â”€ Single option group â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function OptionGroup({
  option,
  onAddValue,
  onRemoveValue,
  onRemoveGroup,
}: {
  option: Option;
  onAddValue: (draft: Omit<OptionValue, 'id'>) => Promise<void>;
  onRemoveValue: (valueId: string) => Promise<void>;
  onRemoveGroup: () => Promise<void>;
}) {
  const isColor = option.kind === 'color';
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [price, setPrice] = useState(0);
  const [hex, setHex] = useState('#F3E3C3');
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    if (!code || !label) return;
    setBusy(true);
    await onAddValue({
      code,
      label,
      priceDeltaCents: price,
      meta: isColor ? { hex } : null,
      sortOrder: option.values.length,
    });
    setCode('');
    setLabel('');
    setPrice(0);
    setHex('#F3E3C3');
    setBusy(false);
  }

  const kindLabel = OPTION_KINDS.find((k) => k.value === option.kind)?.label ?? option.kind;

  return (
    <fieldset className="space-y-3 rounded-md border border-ink/10 p-3">
      <div className="flex items-center justify-between">
        <legend className="px-1 text-sm font-medium text-ink">
          {option.label}{' '}
          <span className="text-xs font-normal text-ink/50">({kindLabel})</span>
        </legend>
        <button
          type="button"
          onClick={onRemoveGroup}
          className="text-xs text-ember/70 hover:text-ember"
        >
          Eliminar grup
        </button>
      </div>

      {/* Existing values */}
      {option.values.length > 0 && (
        <ul className="space-y-1">
          {option.values.map((v) => (
            <li
              key={v.id}
              className="flex items-center gap-3 rounded-md bg-ink/5 px-3 py-2 text-sm"
            >
              {isColor && (v.meta as { hex?: string } | null)?.hex && (
                <span
                  className="inline-block h-4 w-4 shrink-0 rounded-full border border-ink/10"
                  style={{ background: (v.meta as { hex: string }).hex }}
                />
              )}
              <span className="font-mono text-xs text-ink/60">{v.code}</span>
              <span className="flex-1">{v.label}</span>
              <span className="text-xs text-ink/50">
                {v.priceDeltaCents === 0
                  ? 'sense cost extra'
                  : `${v.priceDeltaCents > 0 ? '+' : ''}${(v.priceDeltaCents / 100).toFixed(2)} â‚¬`}
              </span>
              <button
                type="button"
                onClick={() => onRemoveValue(v.id)}
                className="text-ember/60 hover:text-ember"
              >
                âœ•
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add new value */}
      <div className="grid gap-2 sm:grid-cols-[1fr_2fr_auto_auto]">
        <label className="block space-y-1">
          <span className="text-xs text-ink/50">Codi</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
            placeholder="rosa-sec"
            className={inputCls}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-ink/50">Nom visible</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Rosa seca"
            className={inputCls}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-ink/50">Cost extra (â‚¬)</span>
          <input
            type="number"
            step="0.01"
            value={(price / 100).toFixed(2)}
            onChange={(e) => setPrice(Math.round(parseFloat(e.target.value || '0') * 100))}
            className={inputCls}
          />
        </label>
        {isColor && (
          <label className="block space-y-1">
            <span className="text-xs text-ink/50">Color</span>
            <input
              type="color"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              className="h-[38px] w-12 cursor-pointer rounded-md border border-ink/15 bg-cream p-1"
            />
          </label>
        )}
      </div>
      <button
        type="button"
        onClick={handleAdd}
        disabled={busy || !code || !label}
        className="btn-ghost text-sm disabled:opacity-40"
      >
        {busy ? 'â€¦' : '+ Afegir valor'}
      </button>
    </fieldset>
  );
}

