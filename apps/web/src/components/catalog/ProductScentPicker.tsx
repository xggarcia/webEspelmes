'use client';

export type ScentOption = { id: string; nameEs: string; nameCa: string };

export function ProductScentPicker({
  scents,
  selected,
  onChange,
  locale,
  label,
}: {
  scents: ScentOption[];
  selected: string | null;
  onChange: (id: string | null) => void;
  locale: string;
  label: string;
}) {
  if (scents.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wider text-ink/50">{label}</p>
      <div className="flex flex-wrap gap-2">
        {scents.map((s) => {
          const name = locale === 'es' ? s.nameEs : s.nameCa;
          const active = selected === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange(active ? null : s.id)}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                active
                  ? 'border-ink bg-ink text-cream'
                  : 'border-ink/20 text-ink/60 hover:border-ink/50 hover:text-ink'
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
