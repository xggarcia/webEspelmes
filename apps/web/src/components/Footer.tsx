import { getTranslations } from 'next-intl/server';

export async function Footer() {
  const t = await getTranslations('footer');
  const tBrand = await getTranslations('brand');
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-ink/5 bg-linen/50">
      <div className="container-lux flex flex-col items-start justify-between gap-3 py-8 text-sm text-ink/70 md:flex-row md:items-center">
        <p className="font-display text-base text-ink">{tBrand('shortTagline')}</p>
        <p>© {year} {tBrand('name')} — {t('rights')}</p>
      </div>
    </footer>
  );
}
