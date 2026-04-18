import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale, getLocale } from 'next-intl/server';
import { safeApiFetch } from '@/lib/api-server';
import { getSession } from '@/lib/auth';
import { formatEur } from '@/lib/currency';
import { LogoutButton } from '@/components/account/LogoutButton';
import { ProfileForm } from '@/components/account/ProfileForm';
import { ChangePasswordForm } from '@/components/account/ChangePasswordForm';

type Order = {
  id: string;
  number: string;
  status: string;
  totalCents: number;
  createdAt: string;
};

type Props = { params: Promise<{ locale: string }> };

export default async function AccountPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = await getLocale();
  const session = await getSession();
  if (!session) redirect(`/${locale}/auth/login`);
  const t = await getTranslations('account');
  const orders = (await safeApiFetch<Order[]>('/orders/mine', { forwardCookies: true })) ?? [];

  return (
    <div className="space-y-10 max-w-2xl">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-ink">{t('title')}</h1>
          <p className="text-ink/70">{session.email}</p>
        </div>
        <LogoutButton label={t('logout')} />
      </header>

      {/* Orders */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl text-ink">{t('ordersTitle')}</h2>
        {orders.length === 0 ? (
          <p className="text-ink/60">{t('noOrders')}</p>
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => (
              <li key={o.id} className="card-warm flex flex-wrap items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-display text-lg text-ink">
                    {t('orderNumber')} {o.number}
                  </p>
                  <p className="text-ink/60">
                    {t('placed')} {new Date(o.createdAt).toLocaleDateString(loc === 'es' ? 'es-ES' : 'ca-ES')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="rounded-full bg-sage/20 px-3 py-1 text-xs uppercase tracking-wider text-sage">
                    {o.status}
                  </span>
                  <span className="font-medium text-ember">
                    {formatEur(o.totalCents, loc === 'es' ? 'es-ES' : 'ca-ES')}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Profile */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl text-ink">{t('profileTitle')}</h2>
        <ProfileForm
          initialName={session.name ?? ''}
          initialEmail={session.email}
          labels={{
            name: t('name'),
            email: t('email'),
            save: t('save'),
            saved: t('saved'),
            emailTaken: t('emailTaken'),
            error: t('error'),
          }}
        />
      </section>

      {/* Security */}
      <section className="space-y-3">
        <h2 className="font-display text-2xl text-ink">{t('securityTitle')}</h2>
        <ChangePasswordForm
          labels={{
            current: t('currentPassword'),
            new: t('newPassword'),
            save: t('save'),
            saved: t('passwordSaved'),
            wrongPassword: t('wrongPassword'),
            error: t('error'),
          }}
        />
      </section>
    </div>
  );
}
