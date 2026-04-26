'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from '@/i18n/routing';

type Tab = { slug: string; label: string };

export function CategoryTabs({ tabs, active }: { tabs: Tab[]; active: string }) {
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const w = wrapRef.current;
    if (!w) return;
    const el = w.querySelector<HTMLButtonElement>(`[data-slug="${active}"]`);
    if (!el) return;
    const wRect = w.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    setPillStyle({ left: eRect.left - wRect.left, width: eRect.width });
  }, [active]);

  function go(slug: string) {
    router.push(slug === 'all' ? '/botiga' : `/botiga?cat=${slug}`);
  }

  return (
    <div
      ref={wrapRef}
      className="relative inline-flex items-center rounded-full border border-ink/[0.08] bg-hush/60 p-1"
    >
      {pillStyle && (
        <span
          aria-hidden
          className="absolute top-1 bottom-1 rounded-full bg-bone shadow-warm transition-all duration-500"
          style={{ left: pillStyle.left, width: pillStyle.width, transitionTimingFunction: 'cubic-bezier(.2,.7,.2,1)' }}
        />
      )}
      {tabs.map((t) => (
        <button
          key={t.slug}
          data-slug={t.slug}
          type="button"
          onClick={() => go(t.slug)}
          className={`relative z-10 rounded-full px-5 py-2 text-sm transition-colors ${
            active === t.slug ? 'text-ink' : 'text-ink/55 hover:text-ink/80'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

