import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { token } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('auth');

  if (!token) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="font-display text-4xl text-ink">{t('resetTitle')}</h1>
        <p className="text-ember text-sm">{t('resetInvalid')}</p>
        <Link href="/auth/forgot" className="text-sm text-ember hover:underline">
          {t('forgotLink')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <header>
        <h1 className="font-display text-4xl text-ink">{t('resetTitle')}</h1>
        <p className="text-ink/70">{t('resetLead')}</p>
      </header>
      <ResetPasswordForm
        token={token}
        labels={{
          newPassword: t('newPassword'),
          submit: t('resetSubmit'),
          invalid: t('resetInvalid'),
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
