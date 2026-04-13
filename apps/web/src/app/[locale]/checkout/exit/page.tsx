import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';

type Props = { params: Promise<{ locale: string }> };

export default async function CheckoutExitPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('checkout');
  return (
    <div className="card-warm mx-auto max-w-xl space-y-4 text-center">
      <h1 className="font-display text-4xl text-ember">{t('successTitle')}</h1>
      <p className="text-ink/70">{t('successBody')}</p>
      <Link href="/" className="btn-primary inline-flex no-underline">
        {t('backHome')}
      </Link>
    </div>
  );
}
