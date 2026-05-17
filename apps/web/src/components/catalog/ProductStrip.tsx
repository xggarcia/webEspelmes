import type { ProductSummary } from '@espelmes/shared';
import { Link } from '@/i18n/routing';
import { getLocale } from 'next-intl/server';
import { formatEur } from '@/lib/currency';

export async function ProductStrip({ product: p }: { product: ProductSummary }) {
  const locale = await getLocale();
  const price = formatEur(p.basePriceCents, locale === 'es' ? 'es-ES' : 'ca-ES');

  return (
    <Link
      href={`/botiga/${p.slug}`}
      className="group flex items-center gap-5 border-y border-ink/[0.07] py-6 no-underline sm:gap-7"
    >
      <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-[2px] bg-hush/50 sm:w-24">
        {p.heroImageUrl ? (
          <img
            src={p.heroImageUrl}
            alt={p.name}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="h-full w-full ph-stripes" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-display text-[20px] leading-snug text-ink transition-colors duration-300 group-hover:text-ink/50 md:text-[24px]">
            {p.name}
          </h3>
          {p.shortDescription && (
            <p className="mt-1 max-w-[60ch] truncate text-[13px] text-ink/35">
              {p.shortDescription}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-5">
          <span className="num text-[15px] text-ink/50">{price}</span>
          <span
            className="meta text-ink/25 transition-colors duration-300 group-hover:text-ink/60"
            aria-hidden
          >
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
