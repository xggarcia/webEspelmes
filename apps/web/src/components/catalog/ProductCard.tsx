import type { ProductSummary } from '@espelmes/shared';
import { Link } from '@/i18n/routing';
import { formatEur } from '@/lib/currency';
import { getLocale, getTranslations } from 'next-intl/server';
import { Placeholder } from '@/components/ui/Placeholder';

export async function ProductCard({ product }: { product: ProductSummary }) {
  const locale = await getLocale();
  const t = await getTranslations('catalog');
  const tp = await getTranslations('product');
  // Click goes directly to the configurator "” no detail page intermediate.
  const href = `/personalitza/${product.slug}`;
  return (
    <Link
      href={href}
      className="group block no-underline lift-on-hover"
    >
      <div className="relative mb-4 aspect-[4/5] w-full overflow-hidden rounded-2xl border border-ink/[0.06] bg-hush/50">
        {product.heroImageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={product.heroImageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <Placeholder
            label={`${product.name.toLowerCase()}`}
            tone="hush"
          />
        )}
        {product.isCustomizable && (
          <span className="absolute left-3 top-3 rounded-full bg-bone/90 px-2.5 py-1 meta text-ink/70 backdrop-blur">
            {t('personalize')}
          </span>
        )}
        {!product.inStock && (
          <span className="absolute right-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 meta text-bone">
            {tp('outOfStock')}
          </span>
        )}
      </div>
      <div className="flex items-baseline justify-between gap-3 px-1">
        <h3 className="font-display text-[19px] leading-tight text-ink group-hover:text-ember transition-colors">
          {product.name}
        </h3>
        <span className="num whitespace-nowrap text-sm text-ink/80">
          {formatEur(product.basePriceCents, locale === 'es' ? 'es-ES' : 'ca-ES')}
        </span>
      </div>
      {product.shortDescription && (
        <p className="mt-1 line-clamp-1 px-1 text-sm text-ink/55">{product.shortDescription}</p>
      )}
    </Link>
  );
}

