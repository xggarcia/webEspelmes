import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';

type Props = { params: Promise<{ locale: string }> };

export default async function CheckoutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('checkout');
  const labels = {
    email: t('email'),
    fullName: t('fullName'),
    street: t('street'),
    city: t('city'),
    postalCode: t('postalCode'),
    country: t('country'),
    notes: t('notes'),
    pay: t('pay'),
    subtotal: t('subtotal'),
    shipping: t('shipping'),
    total: t('total'),
    shippingCalculating: t('shippingCalculating'),
    stripeDev: t('stripeDev'),
  };

  return (
    <div className="container-lux py-12 grid gap-8 md:grid-cols-[1.3fr_1fr]">
      <div className="space-y-4">
        <h1 className="font-display text-4xl text-ink">{t('title')}</h1>
        <p className="text-ink/70">{t('lead')}</p>
        <CheckoutForm defaultEmail="" labels={labels} />
      </div>
    </div>
  );
}
