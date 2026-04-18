import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { AuthForm } from '@/components/auth/AuthForm';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ reset?: string }>;
};

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { reset } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('auth');
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="font-display text-4xl text-ink">{t('loginTitle')}</h1>
      {reset && (
        <p className="rounded-md bg-sage/15 px-4 py-2 text-sm text-sage">{t('resetSuccess')}</p>
      )}
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
      <div className="flex justify-between text-sm text-ink/70">
        <p>
          {t('noAccount')}{' '}
          <Link href="/auth/register" className="text-ember hover:underline">
            {t('createOne')}
          </Link>
        </p>
        <Link href="/auth/forgot" className="text-ember hover:underline">
          {t('forgotLink')}
        </Link>
      </div>
    </div>
  );
}
