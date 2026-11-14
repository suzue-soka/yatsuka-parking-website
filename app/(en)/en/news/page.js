import { NewsIndexView, newsIndexMetadata } from '@/components/views/NewsViews';
import { alternates } from '@/lib/i18n';

export const metadata = { ...newsIndexMetadata('en'), alternates: alternates('en', '/news') };

export default function Page() {
  return <NewsIndexView lang="en" />;
}
