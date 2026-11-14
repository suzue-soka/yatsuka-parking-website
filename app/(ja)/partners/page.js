import PartnersView from '@/components/views/PartnersView';
import { getContent } from '@/lib/content';
import { alternates } from '@/lib/i18n';

const c = getContent('ja');
export const metadata = { title: c.partnersPage.title, description: c.partnersPage.metaDesc, alternates: alternates('ja', '/partners') };

export default function Page() {
  return <PartnersView lang="ja" />;
}
