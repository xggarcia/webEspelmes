import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { AuthForm } from '@/components/auth/AuthForm';

type Props = { params: Promise<{ locale: string }> };

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('auth');
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="font-display text-4xl text-ink">{t('loginTitle')}</h1>
      <AuthForm
        mode="login"
        labels={{
          email: t('email'),
          password: t('password'),
          submit: t('submitLogin'),
          invalid: t('invalidCredentials'),
          unexpected: t('unexpectedError'),
        }}
      />
      <p className="text-sm text-ink/70">
        {t('noAccount')}{' '}
        <Link href="/auth/register" className="text-ember hover:underline">
          {t('createOne')}
        </Link>
      </p>
    </div>
  );
}
