import { getLocale } from 'next-intl/server';
import './globals.css';

/**
 * Root layout - provides HTML structure
 * Locale-specific content is in [locale]/layout.tsx
 */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

