import type { ProductSummary } from '@espelmes/shared';
import { Link } from '@/i18n/routing';
import { formatEur } from '@/lib/currency';
import { getLocale, getTranslations } from 'next-intl/server';

export async function ProductCard({ product }: { product: ProductSummary }) {
  const locale = await getLocale();
  const t = await getTranslations('catalog');
  const tp = await getTranslations('product');
  return (
    <Link
      href={`/botiga/${product.slug}`}
      className="card-warm group block no-underline transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="mb-3 aspect-[4/5] w-full overflow-hidden rounded-xl2 bg-wax/40">
        {product.heroImageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={product.heroImageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ember/40">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3c-1.5 2-3 3.5-3 5.5A3 3 0 0 0 12 11.5 3 3 0 0 0 15 8.5C15 6.5 13.5 5 12 3z"
                fill="currentColor"
              />
              <rect x="9" y="12" width="6" height="8" rx="1" fill="currentColor" opacity="0.6" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg text-ink">{product.name}</h3>
          {product.shortDescription && (
            <p className="mt-0.5 line-clamp-2 text-sm text-ink/60">{product.shortDescription}</p>
          )}
        </div>
        <span className="whitespace-nowrap text-sm font-medium text-ember">
          {formatEur(product.basePriceCents, locale === 'es' ? 'es-ES' : 'ca-ES')}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        {product.isCustomizable && (
          <span className="rounded-full bg-sage/20 px-2 py-0.5 text-sage">{t('personalize')}</span>
        )}
        {!product.inStock && (
          <span className="rounded-full bg-ink/10 px-2 py-0.5 text-ink/60">{tp('outOfStock')}</span>
        )}
      </div>
    </Link>
  );
}
