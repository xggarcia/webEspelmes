import { notFound } from 'next/navigation';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { safeApiFetch } from '@/lib/api-server';
import { formatEur } from '@/lib/currency';
import { Link } from '@/i18n/routing';
import { ProductImageCarousel } from '@/components/catalog/ProductImageCarousel';
import { ProductActions } from '@/components/catalog/ProductActions';
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
  const price = formatEur(product.basePriceCents, loc === 'es' ? 'es-ES' : 'ca-ES');
  const colors = product.colors ?? [];
  const scents = product.scents ?? [];

  return (
    <div className="container-lux py-12 md:py-16">
      <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:gap-16 lg:gap-24">

        {/* ── Images ───────────────────────────────────────────── */}
        <div className="md:sticky md:top-24 md:self-start">
          <ProductImageCarousel images={images} productName={product.name} />
        </div>

        {/* ── Info ─────────────────────────────────────────────── */}
        <div className="space-y-8 animate-lift">

          {/* Category + name */}
          <div>
            <p className="eyebrow mb-3">{product.categorySlug}</p>
            <h1 className="font-display text-[38px] leading-[1.05] tracking-tight text-ink md:text-[48px]">
              {product.name}
            </h1>
          </div>

          {/* Price */}
          <div className="border-y border-ink/[0.07] py-5">
            <p className="font-display text-3xl text-ink">{price}</p>
            <p className="mt-1 text-[13px] text-ink/40">{tp('vatIncluded')}</p>
          </div>

          {/* Description */}
          {product.description && (
            <p className="max-w-[46ch] text-[15px] leading-relaxed text-ink/60">
              {product.description}
            </p>
          )}

          {/* Stock */}
          <div className="flex items-center gap-3">
            <span
              className={`h-2 w-2 rounded-full ${product.inStock ? 'bg-green-500' : 'bg-ink/25'}`}
            />
            <span className="text-[13px] text-ink/55">
              {product.inStock
                ? tp('inStock', { n: product.stock })
                : tp('outOfStock')}
            </span>
          </div>

          {/* Pickers + add to cart */}
          <ProductActions
            productId={product.id}
            inStock={product.inStock}
            colors={colors}
            scents={scents}
            isCustomizable={product.isCustomizable}
            locale={loc}
            addToCartLabel={tp('addToCart')}
            colorLabel={tp('colorLabel')}
            scentLabel={tp('scentLabel')}
            selectColorLabel={tp('selectColor')}
            selectScentLabel={tp('selectScent')}
          />

          {/* Back */}
          <Link
            href="/botiga"
            className="btn-link no-underline inline-flex text-ink/35 hover:text-ink/60"
          >
            {tp('backToShop')}
          </Link>

        </div>
      </div>
    </div>
  );
}
