import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ProductCard } from '@/components/catalog/ProductCard';
import { safeApiFetch } from '@/lib/api-server';
import { Link } from '@/i18n/routing';
import type { ProductSummary } from '@espelmes/shared';

type Category = { id: string; slug: string; name: string };

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; sort?: string }>;
};

export default async function CatalogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('catalog');
  const sp = await searchParams;

  const qs = new URLSearchParams();
  qs.set('pageSize', '24');
  qs.set('sort', sp.sort ?? 'new');
  if (sp.category) qs.set('categorySlug', sp.category);

  const [list, cats] = await Promise.all([
    safeApiFetch<{ items: ProductSummary[]; total: number }>(`/products?${qs.toString()}`),
    safeApiFetch<Category[]>('/categories'),
  ]);
  const items = list?.items ?? [];
  const categories = cats ?? [];

  const sortOptions: Array<{ value: string; labelKey: 'sortNew' | 'sortPriceAsc' | 'sortPriceDesc' }> = [
    { value: 'new', labelKey: 'sortNew' },
    { value: 'price_asc', labelKey: 'sortPriceAsc' },
    { value: 'price_desc', labelKey: 'sortPriceDesc' },
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-4xl text-ink">{t('title')}</h1>
        <p className="max-w-2xl text-ink/70">{t('lead')}</p>
      </header>

      <div className="flex flex-wrap items-center gap-4 border-b border-ink/5 pb-4 text-sm">
        <span className="text-ink/60">{t('filterCategory')}:</span>
        <Link
          href="/botiga"
          className={`no-underline ${!sp.category ? 'text-ember' : 'text-ink/70 hover:text-ember'}`}
        >
          {t('filterAll')}
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={{ pathname: '/botiga', query: { category: c.slug } }}
            className={`no-underline ${sp.category === c.slug ? 'text-ember' : 'text-ink/70 hover:text-ember'}`}
          >
            {c.name}
          </Link>
        ))}
        <span className="ml-auto text-ink/60">{t('sort')}:</span>
        {sortOptions.map((o) => (
          <Link
            key={o.value}
            href={{
              pathname: '/botiga',
              query: { ...(sp.category ? { category: sp.category } : {}), sort: o.value },
            }}
            className={`no-underline ${(sp.sort ?? 'new') === o.value ? 'text-ember' : 'text-ink/70 hover:text-ember'}`}
          >
            {t(o.labelKey)}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-ink/60">{t('empty')}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
