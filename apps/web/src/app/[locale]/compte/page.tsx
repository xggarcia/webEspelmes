import { redirect } from 'next/navigation';
import { getTranslations, setRequestLocale, getLocale } from 'next-intl/server';
import { safeApiFetch } from '@/lib/api-server';
import { getSession } from '@/lib/auth';
import { formatEur } from '@/lib/currency';

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
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl text-ink">{t('title')}</h1>
        <p className="text-ink/70">
          {t('lead')} — {session.email}
        </p>
      </header>
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
    </div>
  );
}
