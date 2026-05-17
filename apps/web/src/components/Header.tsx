import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { BrandLogo } from './brand/BrandLogo';
import { LocaleSwitcher } from './LocaleSwitcher';
import { HeaderNav } from './HeaderNav';

export async function Header() {
  const t = await getTranslations('nav');
  return (
    <header className="sticky top-0 z-40 border-b border-ink/[0.06] bg-white/90 backdrop-blur-md">
      <div className="container-lux flex h-[68px] items-center justify-between gap-6">
        <Link href="/" className="no-underline">
          <BrandLogo />
        </Link>
        <div className="flex flex-1 items-center justify-between gap-4">
          <HeaderNav
            home={t('home')}
            shop={t('shop')}
            about={t('about')}
            contact={t('contact')}
            cart={t('cart')}
          />
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
