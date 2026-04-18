import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ForgotForm } from '@/components/auth/ForgotForm';

type Props = { params: Promise<{ locale: string }> };

export default async function ForgotPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('auth');
  return (
    <div className="mx-auto max-w-md space-y-6">
      <header>
        <h1 className="font-display text-4xl text-ink">{t('forgotTitle')}</h1>
        <p className="text-ink/70">{t('forgotLead')}</p>
      </header>
      <ForgotForm
        labels={{
          email: t('email'),
          submit: t('forgotSubmit'),
          sent: t('forgotSent'),
          unexpected: t('unexpectedError'),
        }}
      />
      <p className="text-sm text-ink/70">
        <Link href="/auth/login" className="text-ember hover:underline">
          {t('backToLogin')}
        </Link>
      </p>
    </div>
  );
}
