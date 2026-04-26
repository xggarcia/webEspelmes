import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { safeApiFetch } from '@/lib/api-server';
import { ConfiguratorRoot } from '@/components/configurator/ConfiguratorRoot';
import type { ProductDetail } from '@espelmes/shared';

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function PersonalitzaPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const product = await safeApiFetch<ProductDetail>(`/products/${slug}`);
  if (!product) notFound();
  if (!product.isCustomizable) notFound();
  const t = await getTranslations('configurator');

  return (
    <section className="container-lux py-8 md:py-10">
      <div className="space-y-7">
        <header className="mx-auto max-w-3xl space-y-2 text-center">
          <p className="text-sm uppercase tracking-widest text-ember/70">{product.name}</p>
          <h1 className="font-display text-4xl text-ink md:text-5xl">{t('title')}</h1>
          <p className="mx-auto max-w-2xl text-ink/70">{t('lead')}</p>
        </header>
        <ConfiguratorRoot product={product} locale={locale} />
      </div>
    </section>
  );
}
