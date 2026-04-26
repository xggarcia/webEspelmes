'use client';

import { useLocale } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { routing } from '@/i18n/routing';

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  function getCurrentInternalPath() {
    if (typeof window === 'undefined') return '/';
    const raw = window.location.pathname || '/';
    const path = raw.replace(/^\/(ca|es)(?=\/|$)/, '') || '/';
    return path;
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => router.replace(getCurrentInternalPath(), { locale: loc })}
          className={`rounded-md px-2 py-1 transition ${
            loc === locale
              ? 'bg-ink/10 text-ink'
              : 'text-ink/60 hover:text-ink'
          }`}
          aria-pressed={loc === locale}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

