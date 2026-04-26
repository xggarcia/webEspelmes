'use client';

import { useState } from 'react';

export function ColorPicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { code: string; hex: string; name: string; deltaCents: number }[];
  onChange: (hex: string, name?: string) => void;
}) {
  const [custom, setCustom] = useState(value);
  const selected = options.find((o) => o.hex.toLowerCase() === value.toLowerCase());

  return (
    <div className="space-y-3 px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-[1.9rem] font-display leading-none text-ink">{label}</p>
        <p className="text-sm text-ink/60">{selected?.name ?? custom}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {options.map((o) => {
          const active = o.hex.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={o.code}
              type="button"
              onClick={() => onChange(o.hex, o.name)}
              title={o.deltaCents !== 0 ? `${o.name} (${o.deltaCents > 0 ? '+' : ''}${(o.deltaCents / 100).toFixed(2)}€)` : o.name}
              aria-label={o.name}
              className={`h-8 w-8 rounded-full border-2 transition ${
                active ? 'border-ember shadow-warm' : 'border-ink/15 hover:border-ember/50'
              }`}
              style={{ backgroundColor: o.hex }}
            />
          );
        })}
        <label className="ml-2 flex items-center gap-2 rounded-md border border-ink/15 bg-cream px-2 py-1 text-xs text-ink/70">
          <input
            type="color"
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              onChange(e.target.value);
            }}
            className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
          />
          <span className="font-mono uppercase">{custom}</span>
        </label>
      </div>
    </div>
  );
}

