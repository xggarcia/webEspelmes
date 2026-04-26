'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { API_BASE } from '@/lib/api';
import {
  getConfiguratorSocket,
  disposeConfiguratorSocket,
} from '@/lib/configurator-socket';
import type {
  ConfiguratorPatch,
  ConfiguratorServerState,
  ConfiguratorState,
  ProductDetail,
} from '@espelmes/shared';
import { LivePreview2D } from './LivePreview2D';
import { LivePreview3D } from './LivePreview3D';
import { ShapeSelect } from './controls/ShapeSelect';
import { SizeSelect } from './controls/SizeSelect';
import { ColorPicker } from './controls/ColorPicker';
import { FinishSelect } from './controls/FinishSelect';
import { PlatformSelect } from './controls/PlatformSelect';
import { LabelEditor } from './controls/LabelEditor';
import { Accessories } from './controls/Accessories';

const EVENTS = {
  Join: 'configurator:join',
  Update: 'configurator:update',
  State: 'configurator:state',
  Error: 'configurator:error',
} as const;

export function ConfiguratorRoot({
  product,
  locale,
}: {
  product: ProductDetail;
  locale: string;
}) {
  const t = useTranslations('configurator');
  const tp = useTranslations('product');
  const router = useRouter();
  const [server, setServer] = useState<ConfiguratorServerState | null>(null);
  const [status, setStatus] = useState<'connecting' | 'ready' | 'offline'>('connecting');
  const modelUrl = (product as { modelUrl?: string | null }).modelUrl ?? null;
  const modelMeta =
    (product as { modelMeta?: { scale?: number; yOffset?: number; cameraFov?: number } | null })
      .modelMeta ?? null;
  const [model3dFailed, setModel3dFailed] = useState(false);
  const show3D = Boolean(modelUrl) && !model3dFailed;
  const [addErr, setAddErr] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const patchThrottle = useRef<number | null>(null);
  const pending = useRef<ConfiguratorPatch>({});

  useEffect(() => {
    const socket = getConfiguratorSocket();

    // If we haven't received any state within 8 s, declare offline.
    const timeout = window.setTimeout(() => {
      setStatus((s) => (s === 'connecting' ? 'offline' : s));
    }, 8000);

    const onConnect = () => {
      setStatus('ready');
      socket.emit(EVENTS.Join, { productId: product.id });
    };
    const onDisconnect = () => setStatus('offline');
    const onState = (payload: ConfiguratorServerState) => {
      window.clearTimeout(timeout);
      setServer(payload);
    };
    const onError = (e: unknown) => {
      // eslint-disable-next-line no-console
      console.warn('[configurator]', e);
      // If we never got a state, mark offline so the UI doesn't hang.
      setStatus((s) => (s === 'connecting' ? 'offline' : s));
    };
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on(EVENTS.State, onState);
    socket.on(EVENTS.Error, onError);
    if (socket.connected) onConnect();
    return () => {
      window.clearTimeout(timeout);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off(EVENTS.State, onState);
      socket.off(EVENTS.Error, onError);
    };
  }, [product.id]);

  useEffect(() => () => disposeConfiguratorSocket(), []);

  function applyPatch(patch: ConfiguratorPatch) {
    if (!server) return;
    // optimistic local merge so controls feel instant
    setServer((prev) =>
      prev
        ? {
            ...prev,
            state: mergeLocal(prev.state, patch),
          }
        : prev,
    );
    // coalesce into pending patch, send on 80ms tail
    pending.current = { ...pending.current, ...patch } as ConfiguratorPatch;
    if (patchThrottle.current) window.clearTimeout(patchThrottle.current);
    patchThrottle.current = window.setTimeout(() => {
      const socket = getConfiguratorSocket();
      socket.emit(EVENTS.Update, pending.current);
      pending.current = {};
    }, 80);
  }

  const state = server?.state ?? null;
  const price = server?.price ?? null;
  const availability = server?.availability ?? null;

  const options = useMemo(() => buildOptionIndex(product), [product]);

  async function addToCart() {
    if (!state) return;
    setAddErr(null);
    setAdding(true);
    try {
      const res = await fetch(`${API_BASE}/cart/items`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity: state.quantity,
          customization: state,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push('/cistell');
    } catch (e) {
      setAddErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setAdding(false);
    }
  }

  if (!state) {
    return (
      <div className="grid min-h-[300px] place-items-center text-center text-ink/60">
        {status === 'offline' ? (
          <div className="space-y-3">
            <p>{t('disconnected')}</p>
            <button
              type="button"
              className="btn-ghost text-sm"
              onClick={() => window.location.reload()}
            >
              {t('retry')}
            </button>
          </div>
        ) : (
          <p>{t('connecting')}</p>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_1.1fr] md:items-start">
      <div className="space-y-3">
        {status !== 'ready' && (
          <div className="text-xs text-ember/80">{t('disconnected')}</div>
        )}
        {show3D ? (
          <LivePreview3D
            state={state}
            modelUrl={modelUrl}
            modelMeta={modelMeta}
            onFail={() => setModel3dFailed(true)}
          />
        ) : (
          <LivePreview2D state={state} />
        )}
      </div>

      <div className="space-y-6">
        {options.shapes.length > 1 && (
          <ShapeSelect
            label={t('shape')}
            value={state.shape}
            options={options.shapes}
            tNamespace={(k) => t(`shape_${k}` as never) || k}
            onChange={(v) => applyPatch({ shape: v as ConfiguratorState['shape'] })}
          />
        )}
        {options.sizes.length > 1 && (
          <SizeSelect
            label={t('size')}
            value={state.sizeCode}
            options={options.sizes}
            onChange={(v) => applyPatch({ sizeCode: v })}
          />
        )}
        {options.colors.length > 0 && (
          <ColorPicker
            label={t('color')}
            value={state.color.hex}
            options={options.colors}
            onChange={(hex, name) =>
              applyPatch({ color: { hex, ...(name ? { name } : {}) } })
            }
          />
        )}
        {options.finishes.length > 1 && (
          <FinishSelect
            label={t('finish')}
            value={state.finish}
            options={options.finishes}
            tNamespace={(k) => t(`finish_${k}` as never) || k}
            onChange={(v) => applyPatch({ finish: v as ConfiguratorState['finish'] })}
          />
        )}
        {options.platforms.length > 1 && (
          <PlatformSelect
            label={t('platform')}
            value={state.platform}
            options={options.platforms}
            tNamespace={(k) => t(`platform_${k}` as never) || k}
            onChange={(v) => applyPatch({ platform: v as ConfiguratorState['platform'] })}
          />
        )}
        {options.hasLabel && (
          <LabelEditor
            label={t('label')}
            textLabel={t('labelText')}
            fontLabel={t('labelFont')}
            colorLabel={t('labelColor')}
            fontOptions={[
              { value: 'serif', label: t('fontSerif') },
              { value: 'script', label: t('fontScript') },
              { value: 'sans', label: t('fontSans') },
            ]}
            value={state.label}
            onChange={(patch) => applyPatch({ label: { ...state.label, ...patch } })}
          />
        )}
        {options.accessories.length > 0 && (
          <Accessories
            label={t('accessories')}
            value={state.accessories}
            options={options.accessories}
            onChange={(next) => applyPatch({ accessories: next })}
          />
        )}

        <div className="card p-5 space-y-4">
          <div className="flex items-baseline justify-between">
            <span className="text-ink/70">{t('unitPrice')}</span>
            <span className="font-display text-xl text-ember">
              {(price!.unitCents / 100).toLocaleString(locale === 'es' ? 'es-ES' : 'ca-ES', {
                style: 'currency',
                currency: 'EUR',
              })}
            </span>
          </div>
          {price!.breakdown.length > 0 && (
            <ul className="space-y-1 text-xs text-ink/60">
              {price!.breakdown.map((b, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span>{b.label}</span>
                  <span>
                    {b.amountCents >= 0 ? '+' : ''}
                    {(b.amountCents / 100).toLocaleString(locale === 'es' ? 'es-ES' : 'ca-ES', {
                      style: 'currency',
                      currency: 'EUR',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center gap-3">
            <label className="text-sm text-ink/70">{t('quantity')}</label>
            <input
              type="number"
              min={1}
              max={50}
              value={state.quantity}
              onChange={(e) => applyPatch({ quantity: Math.max(1, Math.min(50, +e.target.value || 1)) })}
              className="w-16 rounded-md border border-ink/15 bg-cream px-2 py-1 text-ink"
            />
            <span className="ml-auto font-display text-lg text-ink">
              {t('total')}:{' '}
              <span className="text-ember">
                {(price!.totalCents / 100).toLocaleString(locale === 'es' ? 'es-ES' : 'ca-ES', {
                  style: 'currency',
                  currency: 'EUR',
                })}
              </span>
            </span>
          </div>
          {!availability?.inStock && <p className="text-sm text-ember">{t('outOfStock')}</p>}
          {addErr && <p className="text-xs text-ember">{addErr}</p>}
          <button
            type="button"
            onClick={addToCart}
            disabled={adding || !availability?.inStock}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {adding ? '…' : t('addToCart')}
          </button>
        </div>
      </div>
    </div>
  );
}

function mergeLocal(state: ConfiguratorState, patch: ConfiguratorPatch): ConfiguratorState {
  const next: ConfiguratorState = { ...state };
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    if (k === 'label' && typeof v === 'object' && v !== null) {
      next.label = { ...state.label, ...(v as Partial<ConfiguratorState['label']>) };
    } else if (k === 'color' && typeof v === 'object' && v !== null) {
      next.color = { ...state.color, ...(v as Partial<ConfiguratorState['color']>) };
    } else {
      // @ts-expect-error dynamic assign
      next[k] = v;
    }
  }
  return next;
}

type OptionIndex = {
  shapes: { code: string; label: string; deltaCents: number }[];
  sizes: { code: string; label: string; deltaCents: number }[];
  colors: { code: string; hex: string; name: string; deltaCents: number }[];
  finishes: { code: string; label: string; deltaCents: number }[];
  platforms: { code: string; label: string; deltaCents: number }[];
  accessories: { code: string; label: string; deltaCents: number }[];
  hasLabel: boolean;
};

function buildOptionIndex(p: ProductDetail): OptionIndex {
  const out: OptionIndex = {
    shapes: [],
    sizes: [],
    colors: [],
    finishes: [],
    platforms: [],
    accessories: [],
    hasLabel: false,
  };
  for (const opt of p.options) {
    for (const v of opt.values) {
      const delta = v.priceDeltaCents ?? 0;
      const label = v.label;
      if (opt.kind === 'shape') out.shapes.push({ code: v.code, label, deltaCents: delta });
      else if (opt.kind === 'size') out.sizes.push({ code: v.code, label, deltaCents: delta });
      else if (opt.kind === 'color') {
        const hex = (v.meta as { hex?: string } | undefined)?.hex ?? '#F3E3C3';
        out.colors.push({ code: v.code, hex, name: label, deltaCents: delta });
      } else if (opt.kind === 'finish')
        out.finishes.push({ code: v.code, label, deltaCents: delta });
      else if (opt.kind === 'platform')
        out.platforms.push({ code: v.code, label, deltaCents: delta });
      else if (opt.kind === 'accessory')
        out.accessories.push({ code: v.code, label, deltaCents: delta });
      else if (opt.kind === 'label') out.hasLabel = true;
    }
  }
  return out;
}

