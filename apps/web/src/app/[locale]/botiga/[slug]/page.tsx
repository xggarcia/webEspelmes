import { notFound } from 'next/navigation';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { safeApiFetch } from '@/lib/api-server';
import { formatEur } from '@/lib/currency';
import { Link } from '@/i18n/routing';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import type { ProductDetail } from '@espelmes/shared';

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = await getLocale();
  const product = await safeApiFetch<ProductDetail>(`/products/${slug}`);
  if (!product) notFound();
  const tp = await getTranslations('product');
  const tc = await getTranslations('catalog');

  return (
    <div className="grid gap-10 md:grid-cols-[1.1fr_1fr]">
      <div className="space-y-3">
        <div className="aspect-[4/5] w-full overflow-hidden rounded-xl2 bg-wax/40 shadow-warm">
          {product.images[0] ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={product.images[0].url}
              alt={product.images[0].alt ?? product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ember/30">
              <svg width="100" height="130" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c-1.5 2-3 3.5-3 5.5A3 3 0 0 0 12 11.5 3 3 0 0 0 15 8.5C15 6.5 13.5 5 12 3z" />
                <rect x="9" y="12" width="6" height="8" rx="1" opacity="0.6" />
              </svg>
            </div>
          )}
        </div>
        {product.images.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {product.images.slice(1, 5).map((img, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-md bg-wax/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.alt ?? ''} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-widest text-ember/70">{product.categorySlug}</p>
          <h1 className="mt-1 font-display text-4xl text-ink">{product.name}</h1>
          <p className="mt-3 text-2xl text-ember">
            {formatEur(product.basePriceCents, loc === 'es' ? 'es-ES' : 'ca-ES')}
          </p>
        </div>

        <p className="text-base leading-relaxed text-ink/80">{product.description}</p>

        <div className="flex items-center gap-3 text-sm">
          {product.inStock ? (
            <span className="text-sage">{tp('inStock', { n: product.stock })}</span>
          ) : (
            <span className="text-ink/60">{tp('outOfStock')}</span>
          )}
          {product.isCustomizable && (
            <span className="rounded-full bg-sage/20 px-2 py-0.5 text-xs text-sage">
              {tc('personalize')}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <AddToCartButton productId={product.id} disabled={!product.inStock} label={tp('addToCart')} />
          {product.isCustomizable && (
            <Link href={`/personalitza/${product.slug}`} className="btn-ghost no-underline">
              {tp('customize')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
