import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { safeApiFetch } from '@/lib/api-server';
import { ProductCard } from '@/components/catalog/ProductCard';
import type { ProductSummary } from '@espelmes/shared';

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const tBrand = await getTranslations('brand');
  const featured =
    (await safeApiFetch<{ items: ProductSummary[] }>('/products?pageSize=3&sort=new')) ?? {
      items: [],
    };

  return (
    <div className="space-y-20">
      <section className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <p className="mb-3 text-sm uppercase tracking-widest text-ember/70">{tBrand('shortTagline')}</p>
          <h1 className="font-display text-5xl leading-tight text-ink md:text-6xl">
            {t('heroTitle')}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/70">{t('heroLead')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/botiga" className="btn-primary no-underline">
              {t('ctaShop')}
            </Link>
            <Link href="/botiga" className="btn-ghost no-underline">
              {t('ctaCustomize')}
            </Link>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-sm">
          <div className="aspect-[4/5] w-full rounded-xl2 bg-gradient-to-br from-wax via-cream to-dust shadow-warm" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <svg width="120" height="160" viewBox="0 0 120 160" fill="none" aria-hidden>
              <ellipse
                cx="60"
                cy="30"
                rx="10"
                ry="18"
                className="fill-ember animate-flicker"
                style={{ transformOrigin: '60px 48px' }}
              />
              <rect x="42" y="48" width="36" height="100" rx="6" fill="#F3E3C3" />
              <rect x="42" y="48" width="36" height="6" rx="3" fill="#E9DFCB" />
            </svg>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-display text-3xl text-ink">{t('featuredTitle')}</h2>
          <Link href="/botiga" className="text-sm text-ember hover:underline">
            →
          </Link>
        </div>
        {featured.items.length === 0 ? (
          <p className="text-ink/60">—</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
            {featured.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-8 rounded-xl2 bg-linen/60 p-8 md:grid-cols-[1fr_1.4fr] md:items-center md:p-12">
        <h2 className="font-display text-3xl text-ink">{t('storyTitle')}</h2>
        <p className="text-lg leading-relaxed text-ink/80">{t('storyBody')}</p>
      </section>
    </div>
  );
}
