import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { safeApiFetch } from '@/lib/api-server';
import { ProductCard } from '@/components/catalog/ProductCard';
import { Reveal } from '@/components/ui/Reveal';
import { HeroCarousel } from '@/components/ui/HeroCarousel';
import type { ProductSummary } from '@espelmes/shared';

type Props = { params: Promise<{ locale: string }> };

const MARQUEE_ITEMS = [
  'Cera 100% natural',
  'Fet a mà',
  'Barcelona',
  '48h de flama',
  'Personalitzable',
  'Sense additius',
  'Edicions limitades',
];

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');

  const featured =
    (await safeApiFetch<{ items: ProductSummary[] }>('/products?pageSize=4&sort=new')) ?? {
      items: [],
    };

  const weekly =
    (await safeApiFetch<{ items: ProductSummary[] }>('/products?weeklyFeatured=true&pageSize=20&sort=new')) ?? {
      items: [],
    };

  const heroData =
    (await safeApiFetch<{ items: ProductSummary[] }>('/products?heroFeatured=true&pageSize=8&sort=new')) ?? {
      items: [],
    };

  const heroSlides = heroData.items
    .filter((p) => p.heroImageUrl)
    .map((p) => ({ url: p.heroImageUrl!, alt: p.name }));

  return (
    <div className="overflow-hidden">

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="container-lux">
        <div className="grid min-h-[100dvh] md:grid-cols-[1fr_1.2fr] md:items-center">

          {/* Left: text */}
          <div className="flex flex-col justify-center py-20 md:py-0 md:pr-16 lg:pr-24">
            <p
              className="eyebrow mb-8 animate-lift"
              style={{ animationDelay: '0ms' }}
            >
              {t('heroEyebrow')}
            </p>
            <h1
              className="font-display text-[52px] leading-[1.02] tracking-tight text-ink md:text-[68px] lg:text-[80px] text-balance animate-lift"
              style={{ animationDelay: '80ms' }}
            >
              {t('heroTitle')}
            </h1>
            <p
              className="mt-7 max-w-[38ch] text-[15px] leading-relaxed text-ink/50 animate-lift"
              style={{ animationDelay: '160ms' }}
            >
              {t('heroLead')}
            </p>
            <div
              className="mt-10 flex flex-wrap items-center gap-4 animate-lift"
              style={{ animationDelay: '240ms' }}
            >
              <Link href="/botiga" className="btn-primary no-underline">
                {t('ctaShop')}
              </Link>
            </div>
          </div>

          {/* Right: hero carousel */}
          <div
            className="relative hidden md:block animate-fade"
            style={{ animationDelay: '100ms' }}
          >
            <HeroCarousel slides={heroSlides} />
          </div>

        </div>
      </section>

      {/* ── MARQUEE ─────────────────────────────────────────────── */}
      <div
        className="border-y border-ink/[0.07] py-4 overflow-hidden select-none"
        aria-hidden
      >
        <div className="marquee-track">
          {[0, 1].map((pass) => (
            <div key={pass} className="flex shrink-0 items-center">
              {MARQUEE_ITEMS.map((item) => (
                <span key={item} className="flex items-center">
                  <span className="meta px-7 text-ink/45">{item}</span>
                  <span className="h-[3px] w-[3px] rounded-full bg-ink/20" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── DESTACADES DE LA SETMANA ────────────────────────────── */}
      {weekly.items.length > 0 && (
        <Reveal as="section" className="py-24 md:py-32">
          <div className="container-lux mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow mb-3">{t('weeklyLabel')}</p>
              <h2 className="font-display text-[38px] leading-[1.08] tracking-tight text-ink md:text-[52px]">
                {t('weeklyTitle')}
              </h2>
            </div>
            <Link href="/botiga" className="btn-link no-underline hidden md:inline-flex">
              {t('viewAll')}
            </Link>
          </div>

          {/* Horizontal scroll */}
          <div className="flex gap-5 overflow-x-auto pb-4 pl-5 pr-5 sm:pl-8 sm:pr-8 md:pl-[max(2rem,calc((100vw-1240px)/2))] md:pr-[max(2rem,calc((100vw-1240px)/2))]"
            style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
          >
            {weekly.items.map((p, i) => (
              <div
                key={p.id}
                className="w-[260px] shrink-0 sm:w-[280px] lg:w-[300px]"
                style={{ scrollSnapAlign: 'start' }}
              >
                <Reveal delay={i * 60}>
                  <ProductCard product={p} />
                </Reveal>
              </div>
            ))}
          </div>
        </Reveal>
      )}

      {/* ── RECOMANADES ─────────────────────────────────────────── */}
      <Reveal as="section" className="container-lux pb-24 md:pb-32">
        <div className="mb-14 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow mb-3">{t('collectionLabel')}</p>
            <h2 className="font-display text-[38px] leading-[1.08] tracking-tight text-ink md:text-[52px]">
              {t('featuredTitle')}
            </h2>
          </div>
          <Link href="/botiga" className="btn-link no-underline hidden md:inline-flex">
            {t('viewAll')}
          </Link>
        </div>

        {featured.items.length === 0 ? (
          <div className="rounded-sm border border-ink/[0.07] px-8 py-20 text-center">
            <p className="text-sm text-ink/40">
              Afegeix productes des del panell d&apos;administració.
            </p>
          </div>
        ) : (
          <div className="grid gap-x-5 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {featured.items.slice(0, 4).map((p, i) => (
              <Reveal key={p.id} delay={i * 90}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}
      </Reveal>

      {/* ── STORY ───────────────────────────────────────────────── */}
      <Reveal as="section" className="border-t border-ink/[0.07]">
        <div className="container-lux py-24 md:py-32">
          <div className="grid gap-12 md:grid-cols-2 md:items-center md:gap-20 lg:gap-32">

            <div className="aspect-[4/5] overflow-hidden rounded-[2px] bg-hush/60 order-last md:order-first">
              {/* Story image */}
            </div>

            <div>
              <p className="eyebrow mb-6">{t('storyLabel')}</p>
              <h2 className="font-display text-[34px] leading-[1.08] tracking-tight text-ink md:text-[46px] text-balance">
                {t('storyTitle')}
              </h2>
              <p className="mt-6 text-[15px] leading-relaxed text-ink/55 max-w-[46ch] text-pretty">
                {t('storyBody')}
              </p>
              <Link
                href="/sobre-nosaltres"
                className="btn-link no-underline mt-8 inline-flex"
              >
                {t('whoWeAre')}
              </Link>
            </div>

          </div>
        </div>
      </Reveal>

    </div>
  );
}
