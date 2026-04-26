import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { safeApiFetch } from '@/lib/api-server';
import { ProductCard } from '@/components/catalog/ProductCard';
import { Placeholder } from '@/components/ui/Placeholder';
import { Reveal } from '@/components/ui/Reveal';
import type { ProductSummary } from '@espelmes/shared';

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const tBrand = await getTranslations('brand');
  const featured =
    (await safeApiFetch<{ items: ProductSummary[] }>('/products?pageSize=4&sort=new')) ?? {
      items: [],
    };

  return (
    <div className="overflow-hidden">
      {/* HERO */}
      <section className="container-lux pt-10 pb-24 md:pt-16 md:pb-32">
        <div className="grid gap-12 md:grid-cols-[1.15fr_0.85fr] md:items-end">
          <div className="animate-lift">
            <p className="eyebrow mb-6">{tBrand('shortTagline')}</p>
            <h1 className="font-display text-[56px] leading-[1.08] tracking-tight text-ink md:text-[88px] text-balance">
              {t('heroTitle').split(',').map((part, i, arr) => (
                <span key={i} className={i === arr.length - 1 ? 'italic text-ember' : ''}>
                  {part}{i < arr.length - 1 ? ',' : ''}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
            </h1>
            <p className="mt-10 max-w-md text-[17px] leading-relaxed text-ink/70 text-pretty">
              {t('heroLead')}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/botiga" className="btn-primary no-underline">
                {t('ctaShop')}
                <span aria-hidden>→</span>
              </Link>
              <Link href="/botiga" className="btn-link no-underline">
                {t('ctaCustomize')}
              </Link>
            </div>
            <dl className="mt-14 grid max-w-md grid-cols-3 gap-6 border-t border-ink/[0.07] pt-6">
              <div>
                <dt className="meta">Cera</dt>
                <dd className="mt-1 font-display text-2xl text-ink">100%</dd>
              </div>
              <div>
                <dt className="meta">Hores</dt>
                <dd className="mt-1 font-display text-2xl text-ink">48h+</dd>
              </div>
              <div>
                <dt className="meta">Petites mans</dt>
                <dd className="mt-1 font-display text-2xl text-ink">3</dd>
              </div>
            </dl>
          </div>

          <div className="relative animate-fade">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] border border-ink/[0.07] bg-linen/70">
              <Placeholder label="hero · vela pilar · cera crua" tone="linen" />
              <svg
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                width="160" height="220" viewBox="0 0 120 160" fill="none" aria-hidden
              >
                <ellipse cx="60" cy="30" rx="9" ry="16" className="fill-ember animate-flicker"
                  style={{ transformOrigin: '60px 46px' }} />
                <rect x="40" y="46" width="40" height="104" rx="7" fill="#F3E3C3" />
                <rect x="40" y="46" width="40" height="6" rx="3" fill="#E2D5B5" />
              </svg>
            </div>
            <div className="absolute -bottom-4 right-4 rounded-full bg-bone px-4 py-2 shadow-warm">
              <span className="meta text-ink/65">des de · </span>
              <span className="num text-sm text-ink">14,00 €</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <Reveal as="section" className="container-lux pb-28">
        <div className="mb-10 flex items-end justify-between gap-6 border-t border-ink/[0.07] pt-10">
          <div>
            <p className="eyebrow mb-2">Recomanades</p>
            <h2 className="font-display text-4xl text-ink md:text-5xl">{t('featuredTitle')}</h2>
          </div>
          <Link href="/botiga" className="btn-link no-underline">
            Veure totes <span aria-hidden>→</span>
          </Link>
        </div>
        {featured.items.length === 0 ? (
          <p className="text-ink/60">—</p>
        ) : (
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {featured.items.slice(0, 4).map((p, i) => (
              <Reveal key={p.id} delay={i * 80}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}
      </Reveal>

      {/* TWO CATEGORIES */}
      <Reveal as="section" className="container-lux pb-28">
        <div className="grid gap-5 md:grid-cols-2">
          {[
            { slug: 'veles', title: 'Veles', sub: 'Cera, mecha, foc lent.', tone: 'wax' as const, num: '01' },
            { slug: 'ciment', title: 'Ciment', sub: 'Forma sòlida, tacte de pedra.', tone: 'dust' as const, num: '02' },
          ].map((c) => (
            <Link
              key={c.slug}
              href={`/botiga?cat=${c.slug}`}
              className="group relative block aspect-[4/3] overflow-hidden rounded-[28px] no-underline"
            >
              <Placeholder tone={c.tone} className="transition duration-700 group-hover:scale-[1.03]" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/10 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-between p-8">
                <div className="flex items-center justify-between">
                  <span className="meta text-bone/85">{c.num} / 02</span>
                  <span className="meta text-bone/85">categoria</span>
                </div>
                <div>
                  <h3 className="font-display text-5xl text-bone md:text-6xl">{c.title}</h3>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-bone/80">{c.sub}</p>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-bone text-ink transition group-hover:bg-ember group-hover:text-bone">
                      →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Reveal>

      {/* STORY */}
      <Reveal as="section" className="container-lux pb-32">
        <div className="grid gap-12 rounded-[28px] bg-hush/50 p-10 md:grid-cols-[0.9fr_1.1fr] md:items-center md:p-16">
          <div>
            <p className="eyebrow mb-3">La història</p>
            <h2 className="font-display text-4xl text-ink md:text-5xl text-balance">
              {t('storyTitle')}
            </h2>
          </div>
          <p className="text-[17px] leading-relaxed text-ink/75 text-pretty">{t('storyBody')}</p>
        </div>
      </Reveal>
    </div>
  );
}
