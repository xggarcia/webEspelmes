import type { ProductSummary } from '@espelmes/shared';
import { Link } from '@/i18n/routing';
import { getLocale } from 'next-intl/server';
import { formatEur } from '@/lib/currency';
import { ProductCard } from './ProductCard';

export async function FeaturedGrid({ items }: { items: ProductSummary[] }) {
  const locale = await getLocale();
  const fmt = (cents: number) =>
    formatEur(cents, locale === 'es' ? 'es-ES' : 'ca-ES');

  const [a, b, c, d] = items;

  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {/* A: large 2-col card — at lg spans 2 cols × 2 rows so image fills the height of B+C */}
      {a && (
        <Link
          href={`/botiga/${a.slug}`}
          className="group block no-underline sm:col-span-2 lg:col-span-2 lg:row-span-2"
        >
          <div className="flex h-full flex-col gap-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2px] bg-hush/50 lg:aspect-auto lg:min-h-[360px] lg:flex-1">
              {a.heroImageUrl ? (
                <img
                  src={a.heroImageUrl}
                  alt={a.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                />
              ) : (
                <div className="absolute inset-0 h-full w-full ph-stripes" />
              )}
            </div>
            <div className="flex items-baseline justify-between gap-3 px-0.5">
              <h3 className="font-display text-[18px] leading-snug text-ink transition-colors duration-300 group-hover:text-ink/50">
                {a.name}
              </h3>
              <span className="num shrink-0 text-[14px] text-ink/45">
                {fmt(a.basePriceCents)}
              </span>
            </div>
            {a.shortDescription && (
              <p className="mt-0.5 line-clamp-1 text-[13px] text-ink/30 px-0.5">
                {a.shortDescription}
              </p>
            )}
          </div>
        </Link>
      )}

      {/* B: top-right at lg */}
      {b && <ProductCard product={b} />}

      {/* C: bottom-right at lg */}
      {c && <ProductCard product={c} />}

      {/* D: full-width horizontal strip */}
      {d && (
        <Link
          href={`/botiga/${d.slug}`}
          className="group flex items-center gap-5 no-underline border-t border-ink/[0.07] pt-6 sm:col-span-2 lg:col-span-3"
        >
          <div className="relative aspect-square w-16 shrink-0 overflow-hidden rounded-[2px] bg-hush/50">
            {d.heroImageUrl ? (
              <img
                src={d.heroImageUrl}
                alt={d.name}
                className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
              />
            ) : (
              <div className="h-full w-full ph-stripes" />
            )}
          </div>
          <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-medium text-ink transition-colors duration-300 group-hover:text-ink/50">
                {d.name}
              </h3>
              {d.shortDescription && (
                <p className="mt-0.5 truncate text-[13px] text-ink/35">
                  {d.shortDescription}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <span className="num text-[14px] text-ink/45">
                {fmt(d.basePriceCents)}
              </span>
              <span
                className="meta text-ink/25 transition-colors duration-300 group-hover:text-ink/60"
                aria-hidden
              >
                →
              </span>
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}
