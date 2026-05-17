'use client';

export type ColorOption = { id: string; name: string; hex: string };

export function ProductColorPicker({
  colors,
  selected,
  onChange,
  label = 'Color',
}: {
  colors: ColorOption[];
  selected: string | null;
  onChange: (id: string | null) => void;
  label?: string;
}) {
  if (colors.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wider text-ink/50">{label}</p>
      <div className="flex flex-wrap gap-3">
        {colors.map((c) => {
          const active = selected === c.id;
          return (
            <button
              key={c.id}
              type="button"
              title={c.name}
              onClick={() => onChange(active ? null : c.id)}
              className="group flex flex-col items-center gap-1.5"
            >
              <span
                className={`block h-9 w-9 rounded-full border-2 transition-transform duration-150 ${
                  active
                    ? 'border-ink scale-110 shadow-sm'
                    : 'border-transparent hover:scale-105 hover:border-ink/30'
                }`}
                style={{ background: c.hex }}
              />
              <span
                className={`text-[11px] leading-none transition-colors ${
                  active ? 'text-ink' : 'text-ink/40 group-hover:text-ink/60'
                }`}
              >
                {c.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
