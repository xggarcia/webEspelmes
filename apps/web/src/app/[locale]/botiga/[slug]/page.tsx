import { notFound } from 'next/navigation';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { safeApiFetch } from '@/lib/api-server';
import { formatEur } from '@/lib/currency';
import { Link } from '@/i18n/routing';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { ProductImageCarousel } from '@/components/catalog/ProductImageCarousel';
import type { ProductDetail } from '@espelmes/shared';

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = await getLocale();
  const product = await safeApiFetch<ProductDetail>(`/products/${slug}`);
  if (!product) notFound();
  const images =
    product.images.length > 0
      ? product.images
      : product.heroImageUrl
        ? [{ url: product.heroImageUrl, alt: product.name }]
        : [];
  const tp = await getTranslations('product');
  const tc = await getTranslations('catalog');

  return (
    <div className="grid gap-10 md:grid-cols-[1.1fr_1fr]">
      <div className="space-y-3">
        <ProductImageCarousel images={images} productName={product.name} />
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
