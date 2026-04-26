'use client';

export function SizeSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { code: string; label: string; deltaCents: number }[];
  onChange: (v: string) => void;
}) {
  const selected = options.find((o) => o.code === value);
  return (
    <div className="space-y-3 px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-[1.9rem] font-display leading-none text-ink">{label}</p>
        <p className="text-sm text-ink/60">{selected?.label ?? value}</p>
      </div>
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
              <span className="font-medium">{o.label}</span>
              {o.deltaCents !== 0 && (
                <span className="ml-2 text-xs text-ink/50">
                  {o.deltaCents > 0 ? '+' : ''}{(o.deltaCents / 100).toFixed(2)}€
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

