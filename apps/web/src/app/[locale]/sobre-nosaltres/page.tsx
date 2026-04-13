import { getTranslations, setRequestLocale } from 'next-intl/server';

type Props = { params: Promise<{ locale: string }> };

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('about');
  return (
    <article className="prose-invert mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-4xl text-ink">{t('title')}</h1>
      <p className="text-lg leading-relaxed text-ink/80">{t('p1')}</p>
      <p className="text-lg leading-relaxed text-ink/80">{t('p2')}</p>
    </article>
  );
}
