import HomeView from '@/components/views/HomeView';
import { alternates } from '@/lib/i18n';

export const metadata = { alternates: alternates('ja', '/') };

export default function Page() {
  return <HomeView lang="ja" />;
}
