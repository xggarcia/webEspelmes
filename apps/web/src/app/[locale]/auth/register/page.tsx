import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { AuthForm } from '@/components/auth/AuthForm';

type Props = { params: Promise<{ locale: string }> };

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('auth');
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="font-display text-4xl text-ink">{t('registerTitle')}</h1>
      <AuthForm
        mode="register"
        labels={{
          name: t('name'),
          email: t('email'),
          password: t('password'),
          submit: t('submitRegister'),
          invalid: t('invalidCredentials'),
          unexpected: t('unexpectedError'),
        }}
      />
      <p className="text-sm text-ink/70">
        {t('haveAccount')}{' '}
        <Link href="/auth/login" className="text-ember hover:underline">
          {t('loginHere')}
        </Link>
      </p>
    </div>
  );
}
