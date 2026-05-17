import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ProductCard } from '@/components/catalog/ProductCard';
import { CategoryTabs } from '@/components/catalog/CategoryTabs';
import { Reveal } from '@/components/ui/Reveal';
import { safeApiFetch } from '@/lib/api-server';
import type { ProductSummary } from '@espelmes/shared';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cat?: string; sort?: string }>;
};

const SORT_OPTIONS = [
  { value: 'new',        label: 'Nous' },
  { value: 'price_asc',  label: 'Preu ↑' },
  { value: 'price_desc', label: 'Preu ↓' },
] as const;

export default async function CatalogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('catalog');
  const sp = await searchParams;
  const active = sp.cat ?? 'all';
  const activeSort = sp.sort ?? 'new';

  const qs = new URLSearchParams();
  qs.set('pageSize', '24');
  qs.set('sort', activeSort);
  if (sp.cat && sp.cat !== 'all') qs.set('categorySlug', sp.cat);

  const list = await safeApiFetch<{ items: ProductSummary[]; total: number }>(
    `/products?${qs.toString()}`,
  );
  const items = list?.items ?? [];
  const total = list?.total ?? items.length;

  const tabs = [
    { slug: 'all',    label: t('filterAll') },
    { slug: 'veles',  label: 'Espelmes' },
    { slug: 'ciment', label: 'Ciment' },
  ];

  return (
    <div className="container-lux pt-16 pb-28 md:pt-24">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="mb-14 animate-lift">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow mb-4">Col·lecció</p>
            <h1 className="font-display text-[52px] leading-[1.02] tracking-tight text-ink md:text-[72px]">
              {t('title')}
            </h1>
          </div>
          <p className="meta mb-3 hidden md:block">{total} peces</p>
        </div>
        {t('lead') && (
          <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-ink/45">
            {t('lead')}
          </p>
        )}
      </header>

      {/* ── Filters ────────────────────────────────────────────── */}
      <div className="mb-12 flex flex-wrap items-center justify-between gap-5 border-b border-ink/[0.07] pb-0">
        <CategoryTabs tabs={tabs} active={active} />

        <div className="mb-3 flex items-center gap-1">
          <span className="meta mr-4 text-ink/35">{t('sort')}</span>
          {SORT_OPTIONS.map(({ value, label }) => {
            const p = new URLSearchParams();
            if (active !== 'all') p.set('cat', active);
            p.set('sort', value);
            const isActive = activeSort === value;
            return (
              <a
                key={value}
                href={`?${p.toString()}`}
                className={`rounded-full px-3 py-1 text-[13px] no-underline transition-colors duration-150 ${
                  isActive
                    ? 'bg-ink text-white'
                    : 'text-ink/40 hover:text-ink/70'
                }`}
              >
                {label}
              </a>
            );
          })}
        </div>
      </div>

      {/* ── Grid ───────────────────────────────────────────────── */}
      {items.length === 0 ? (
        <div className="py-32 text-center">
          <p className="text-[15px] text-ink/30">{t('empty')}</p>
        </div>
      ) : (
        <div
          key={active + activeSort}
          className="grid animate-fade gap-x-5 gap-y-14 grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        >
          {items.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i, 7) * 60}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      )}

    </div>
  );
}
