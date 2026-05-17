import type { ProductSummary } from '@espelmes/shared';
import { Link } from '@/i18n/routing';
import { formatEur } from '@/lib/currency';
import { getLocale, getTranslations } from 'next-intl/server';

export async function ProductCard({ product }: { product: ProductSummary }) {
  const locale = await getLocale();
  const t = await getTranslations('catalog');
  const tp = await getTranslations('product');
  const href = `/botiga/${product.slug}`;

  return (
    <Link href={href} className="group block no-underline">
      {/* Image */}
      <div className="relative mb-4 aspect-[3/4] w-full overflow-hidden bg-hush/50">
        {product.heroImageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={product.heroImageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="h-full w-full ph-stripes" />
        )}

        {/* Stock-out badge — only when out of stock */}
        {!product.inStock && (
          <div className="absolute inset-0 flex items-end p-3">
            <span className="text-[10px] font-medium uppercase tracking-widest text-ink/50">
              {tp('outOfStock')}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-0.5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[15px] font-medium leading-snug text-ink transition-colors duration-300 group-hover:text-ink/50">
            {product.name}
          </h3>
          <span className="num shrink-0 text-[14px] text-ink/45">
            {formatEur(product.basePriceCents, locale === 'es' ? 'es-ES' : 'ca-ES')}
          </span>
        </div>
        {product.shortDescription && (
          <p className="mt-1 line-clamp-1 text-[13px] text-ink/30">
            {product.shortDescription}
          </p>
        )}
        {product.isCustomizable && product.inStock && (
          <p className="mt-1.5 text-[11px] uppercase tracking-widest text-ink/30">
            {t('personalize')}
          </p>
        )}
      </div>
    </Link>
  );
}
