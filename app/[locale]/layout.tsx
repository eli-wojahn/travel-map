import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Analytics } from '@vercel/analytics/next';
import { locales } from '@/i18n/config';
import { ThemeProvider } from '@/lib/theme';

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export async function generateMetadata({ params: { locale } }: Props) {
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: t('title'),
    description: t('description'),
    icons: {
      icon: '/favicon.png',
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: Props) {
  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const activeLocale = locale as (typeof locales)[number];

  // Set request locale for next-intl in App Router
  setRequestLocale(activeLocale);

  const messages = await getMessages({ locale: activeLocale });

  return (
    <ThemeProvider>
      <NextIntlClientProvider locale={activeLocale} messages={messages}>
        {children}
        <Analytics />
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}
