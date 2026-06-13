import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, defaultLocale } from './routing';

export default getRequestConfig(async ({ requestLocale, locale: deprecatedLocale }) => {
  let locale = (await requestLocale) || deprecatedLocale;
  
  if (!locale || !locales.includes(locale as any)) {
    locale = defaultLocale;
  }

  return {
    locale: locale as string,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
