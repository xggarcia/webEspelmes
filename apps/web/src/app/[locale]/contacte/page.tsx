import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ContactForm } from '@/components/ContactForm';

type Props = { params: Promise<{ locale: string }> };

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('contact');
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="font-display text-4xl text-ink">{t('title')}</h1>
        <p className="text-ink/70">{t('lead')}</p>
      </header>
      <ContactForm
        labels={{
          name: t('name'),
          email: t('email'),
          message: t('message'),
          send: t('send'),
          thanks: t('thanks'),
        }}
      />
    </div>
  );
}
