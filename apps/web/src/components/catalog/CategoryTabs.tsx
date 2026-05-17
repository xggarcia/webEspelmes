'use client';

import { useRouter } from '@/i18n/routing';
import { canNavigate } from '@/lib/nav-cooldown';

type Tab = { slug: string; label: string };

export function CategoryTabs({ tabs, active }: { tabs: Tab[]; active: string }) {
  const router = useRouter();

  function go(slug: string) {
    if (!canNavigate()) return;
    router.push(slug === 'all' ? '/botiga' : `/botiga?cat=${slug}`);
  }

  return (
    <div className="flex items-center gap-7">
      {tabs.map((t) => (
        <button
          key={t.slug}
          type="button"
          onClick={() => go(t.slug)}
          className={`relative pb-3 text-sm transition-colors duration-200 ${
            active === t.slug
              ? 'text-ink'
              : 'text-ink/40 hover:text-ink/70'
          }`}
        >
          {t.label}
          <span
            className="absolute bottom-0 left-0 h-px w-full bg-ink transition-transform duration-300 origin-left"
            style={{ transform: active === t.slug ? 'scaleX(1)' : 'scaleX(0)' }}
          />
        </button>
      ))}
    </div>
  );
}
