import { redirect } from 'next/navigation';

type Props = {
  params: { locale: string };
};

/**
 * Locale root page - redirects to dashboard
 */
export default function LocalePage({ params: { locale } }: Props) {
  redirect(`/${locale}/dashboard`);
}
