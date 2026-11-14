import { NewsIndexView, newsIndexMetadata } from '@/components/views/NewsViews';
import { alternates } from '@/lib/i18n';

export const metadata = { ...newsIndexMetadata('ja'), alternates: alternates('ja', '/news') };

export default function Page() {
  return <NewsIndexView lang="ja" />;
}
