'use client';

export function FinishSelect({
  label,
  value,
  options,
  tNamespace,
  onChange,
}: {
  label: string;
  value: string;
  options: { code: string; label: string; deltaCents: number }[];
  tNamespace: (k: string) => string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-ink/80">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = o.code === value;
          return (
            <button
              key={o.code}
              type="button"
              onClick={() => onChange(o.code)}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                active
                  ? 'border-ember bg-ember/10 text-ember shadow-warm'
                  : 'border-ink/15 bg-cream text-ink/70 hover:border-ember/40 hover:text-ember'
              }`}
            >
              <span className="font-medium">{o.label || tNamespace(o.code)}</span>
              {o.deltaCents !== 0 && (
                <span className="ml-2 text-xs text-ink/50">
                  {o.deltaCents > 0 ? '+' : ''}{(o.deltaCents / 100).toFixed(2)}â‚¬
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

