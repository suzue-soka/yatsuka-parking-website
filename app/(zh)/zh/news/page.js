import { NewsIndexView, newsIndexMetadata } from '@/components/views/NewsViews';
import { alternates } from '@/lib/i18n';

export const metadata = { ...newsIndexMetadata('zh'), alternates: alternates('zh', '/news') };

export default function Page() {
  return <NewsIndexView lang="zh" />;
}
