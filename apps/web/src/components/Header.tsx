import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { BrandLogo } from './brand/BrandLogo';
import { LocaleSwitcher } from './LocaleSwitcher';
import { getSession } from '@/lib/auth';

export async function Header() {
  const t = await getTranslations('nav');
  const session = await getSession();
  return (
    <header className="border-b border-ink/5 bg-cream/80 backdrop-blur">
      <div className="container-lux flex h-16 items-center justify-between gap-4">
        <Link href="/" className="no-underline">
          <BrandLogo />
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/" className="no-underline hover:text-ember">{t('home')}</Link>
          <Link href="/botiga" className="no-underline hover:text-ember">{t('shop')}</Link>
          <Link href="/sobre-nosaltres" className="no-underline hover:text-ember">{t('about')}</Link>
          <Link href="/contacte" className="no-underline hover:text-ember">{t('contact')}</Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <LocaleSwitcher />
          <Link href="/cistell" className="no-underline hover:text-ember">{t('cart')}</Link>
          {session?.role === 'ADMIN' && (
            <Link href="/admin/dashboard" className="no-underline text-ember hover:text-ink">
              Admin
            </Link>
          )}
          {session ? (
            <Link href="/compte" className="no-underline hover:text-ember">{t('account')}</Link>
          ) : (
            <Link href="/auth/login" className="no-underline hover:text-ember">{t('login')}</Link>
          )}
        </div>
      </div>
    </header>
  );
}
