import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { BrandLogo } from './brand/BrandLogo';
import { LocaleSwitcher } from './LocaleSwitcher';

export async function Header() {
  const t = await getTranslations('nav');
  return (
    <header className="sticky top-0 z-40 border-b border-ink/[0.07] bg-bone/85 backdrop-blur-md">
      <div className="container-lux flex h-[68px] items-center justify-between gap-6">
        <Link href="/" className="no-underline">
          <BrandLogo />
        </Link>
        <nav className="hidden items-center gap-8 text-[13px] md:flex">
          <Link href="/" className="no-underline text-ink/75 transition hover:text-ink">{t('home')}</Link>
          <Link href="/botiga" className="no-underline text-ink/75 transition hover:text-ink">{t('shop')}</Link>
          <Link href="/sobre-nosaltres" className="no-underline text-ink/75 transition hover:text-ink">{t('about')}</Link>
          <Link href="/contacte" className="no-underline text-ink/75 transition hover:text-ink">{t('contact')}</Link>
        </nav>
        <div className="flex items-center gap-4 text-[13px]">
          <LocaleSwitcher />
          <Link
            href="/cistell"
            className="group inline-flex items-center gap-2 rounded-full border border-ink/15 px-3.5 py-1.5 no-underline text-ink/80 transition hover:border-ink/40 hover:text-ink"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 7h16l-1.5 11a2 2 0 0 1-2 1.7H7.5a2 2 0 0 1-2-1.7L4 7z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M9 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span>{t('cart')}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

