'use client';

import { useState } from 'react';
import { API_BASE } from '@/lib/api';

type CommandName = 'recalculate-pricing' | 'bulk-inventory-update' | 'order-status-batch';
type Result = {
  name: string;
  success: boolean;
  durationMs: number;
  affected: number;
  summary: string;
  dryRun?: boolean;
  errors?: { code: string; message: string }[];
};

const EXAMPLES: Record<CommandName, string> = {
  'recalculate-pricing': JSON.stringify(
    { multiplier: 1.05, roundToCents: 10, dryRun: true },
    null,
    2,
  ),
  'bulk-inventory-update': JSON.stringify(
    {
      updates: [{ productId: 'REEMPLAÃ‡A_ID', stockDelta: 10, reason: 'restock abril' }],
      dryRun: true,
    },
    null,
    2,
  ),
  'order-status-batch': JSON.stringify(
    {
      orderIds: ['REEMPLAÃ‡A_ID'],
      targetStatus: 'SHIPPED',
      note: 'enviament agrupat',
    },
    null,
    2,
  ),
};

export function CommandRunner({ commands }: { commands: string[] }) {
  const [name, setName] = useState<CommandName>((commands[0] as CommandName) ?? 'recalculate-pricing');
  const [input, setInput] = useState(EXAMPLES[name]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function pick(n: CommandName) {
    setName(n);
    setInput(EXAMPLES[n]);
    setResult(null);
    setErr(null);
  }

  async function run() {
    setBusy(true);
    setErr(null);
    setResult(null);
    try {
      const body = input.trim() ? JSON.parse(input) : {};
      const res = await fetch(`/api/admin-proxy/admin/commands/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? JSON.stringify(data));
      setResult(data as Result);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {commands.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => pick(c as CommandName)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              c === name ? 'bg-ink text-cream' : 'bg-cream text-ink/70 hover:bg-ink/5'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-medium uppercase tracking-wider text-ink/60">
          Entrada (JSON)
        </span>
        <textarea
          rows={10}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full rounded-md border border-ink/15 bg-cream px-3 py-2 font-mono text-xs text-ink focus:border-ember focus:outline-none"
        />
      </label>

      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="btn-primary disabled:opacity-50"
      >
        {busy ? 'Executantâ€¦' : 'Executar ordre'}
      </button>

      {err && <p className="text-sm text-ember">{err}</p>}

      {result && (
        <div className={`card p-5 ${result.success ? '' : 'border-ember'}`}>
          <div className="flex items-center justify-between">
            <p className="font-display text-lg text-ink">
              {result.success ? 'âœ“' : 'âœ—'} {result.name}
              {result.dryRun && <span className="ml-2 text-xs text-clay">(dry-run)</span>}
            </p>
            <span className="text-xs text-ink/50">{result.durationMs} ms</span>
          </div>
          <p className="mt-1 text-sm text-ink/80">{result.summary}</p>
          <p className="mt-1 text-xs text-ink/50">Afectats: {result.affected}</p>
          {result.errors && result.errors.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-ember">
              {result.errors.map((e, i) => (
                <li key={i}>
                  <span className="font-mono">{e.code}</span>: {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

