import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

type Props = { params: Promise<{ locale: string; slug: string }> };

export default async function PersonalitzaPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  redirect(`/${locale}/botiga/${slug}`);
}
