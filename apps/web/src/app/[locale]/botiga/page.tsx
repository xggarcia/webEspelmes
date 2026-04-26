import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ProductCard } from '@/components/catalog/ProductCard';
import { CategoryTabs } from '@/components/catalog/CategoryTabs';
import { safeApiFetch } from '@/lib/api-server';
import type { ProductSummary } from '@espelmes/shared';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ cat?: string; sort?: string }>;
};

export default async function CatalogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('catalog');
  const sp = await searchParams;
  const active = sp.cat ?? 'all';

  const qs = new URLSearchParams();
  qs.set('pageSize', '24');
  qs.set('sort', sp.sort ?? 'new');
  if (sp.cat && sp.cat !== 'all') qs.set('categorySlug', sp.cat);

  const list = await safeApiFetch<{ items: ProductSummary[]; total: number }>(`/products?${qs.toString()}`);
  const items = list?.items ?? [];
  const total = list?.total ?? items.length;

  const tabs = [
    { slug: 'all', label: t('filterAll') },
    { slug: 'veles', label: 'Espelmes' },
    { slug: 'ciment', label: 'Ciment' },
  ];

  return (
    <div className="container-lux pt-10 pb-24 md:pt-16">
      <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow mb-3">Col·lecció</p>
          <h1 className="font-display text-5xl text-ink md:text-6xl text-balance">
            {t('title')}
          </h1>
          <p className="mt-3 max-w-xl text-ink/65 text-pretty">{t('lead')}</p>
        </div>
        <p className="meta">{total} peces · actualitzat</p>
      </header>

      <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-y border-ink/[0.07] py-5">
        <CategoryTabs tabs={tabs} active={active} />
        <div className="flex items-center gap-1 text-sm">
          <span className="meta mr-3">{t('sort')}</span>
          {(['new', 'price_asc', 'price_desc'] as const).map((v) => {
            const lbl = v === 'new' ? t('sortNew') : v === 'price_asc' ? t('sortPriceAsc') : t('sortPriceDesc');
            const params = new URLSearchParams();
            if (active !== 'all') params.set('cat', active);
            params.set('sort', v);
            const isActive = (sp.sort ?? 'new') === v;
            return (
              <a
                key={v}
                href={`?${params.toString()}`}
                className={`rounded-full px-3 py-1 no-underline transition ${
                  isActive ? 'bg-ink text-bone' : 'text-ink/65 hover:text-ink'
                }`}
              >
                {lbl}
              </a>
            );
          })}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-ink/[0.08] bg-hush/30 px-6 py-24 text-center">
          <p className="text-ink/60">{t('empty')}</p>
        </div>
      ) : (
        <div
          key={active}
          className="grid animate-fade gap-x-6 gap-y-14 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        >
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
