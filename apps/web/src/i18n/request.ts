import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const incoming = await requestLocale;
  const locale =
    incoming && (routing.locales as readonly string[]).includes(incoming)
      ? incoming
      : routing.defaultLocale;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
