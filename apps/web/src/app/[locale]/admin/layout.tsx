import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { setRequestLocale } from 'next-intl/server';
import { AdminNav } from '@/components/admin/AdminNav';

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export default async function AdminLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const jar = await cookies();
  const session = jar.get('admin_session')?.value;
  const expected = process.env.ADMIN_TOKEN;

  if (!expected || session !== expected) {
    redirect(`/${locale}/admin-login`);
  }

  return (
    <div className="container-lux py-10 space-y-5">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="font-display text-3xl text-ink">Tauler de control</h1>
        </div>
      </header>
      <AdminNav />
      <main>{children}</main>
    </div>
  );
}
