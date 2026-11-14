import PrivacyView from '@/components/views/PrivacyView';
import { getContent } from '@/lib/content';
import { alternates } from '@/lib/i18n';

export const metadata = {
  title: getContent('zh').privacy.title,
  alternates: alternates('zh', '/privacy'),
  robots: { index: false },
};

export default function Page() {
  return <PrivacyView lang="zh" />;
}
