'use client';

import type { ConfiguratorState } from '@espelmes/shared';

export function LabelEditor({
  label,
  textLabel,
  fontLabel,
  colorLabel,
  fontOptions,
  value,
  onChange,
}: {
  label: string;
  textLabel: string;
  fontLabel: string;
  colorLabel: string;
  fontOptions: { value: string; label: string }[];
  value: ConfiguratorState['label'];
  onChange: (patch: Partial<ConfiguratorState['label']>) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-ink/80">{label}</p>
      <div className="space-y-2 rounded-lg border border-ink/10 bg-cream/60 p-3">
        <div>
          <label className="text-xs text-ink/60">{textLabel}</label>
          <input
            type="text"
            maxLength={60}
            value={value.text}
            onChange={(e) => onChange({ text: e.target.value })}
            className="mt-1 w-full rounded-md border border-ink/15 bg-cream px-2 py-1 text-sm text-ink focus:border-ember focus:outline-none"
            placeholder="Laia"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-ink/60">{fontLabel}</label>
            <select
              value={value.font}
              onChange={(e) =>
                onChange({ font: e.target.value as ConfiguratorState['label']['font'] })
              }
              className="mt-1 w-full rounded-md border border-ink/15 bg-cream px-2 py-1 text-sm text-ink focus:border-ember focus:outline-none"
            >
              {fontOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-ink/60">{colorLabel}</label>
            <div className="mt-1 flex items-center gap-2 rounded-md border border-ink/15 bg-cream px-2 py-1">
              <input
                type="color"
                value={value.color}
                onChange={(e) => onChange({ color: e.target.value })}
                className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
              />
              <span className="font-mono text-xs uppercase text-ink/60">{value.color}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

