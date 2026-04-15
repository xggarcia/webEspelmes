import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getSession } from '@/lib/auth';
import { AdminNav } from '@/components/admin/AdminNav';

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSession();
  if (!session) redirect(`/${locale}/auth/login`);
  if (session.role !== 'ADMIN') redirect(`/${locale}`);

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-ember/70">Admin</p>
          <h1 className="font-display text-3xl text-ink">
            Hola, {session.name ?? session.email}
          </h1>
        </div>
      </header>
      <AdminNav />
      <main>{children}</main>
    </div>
  );
}
