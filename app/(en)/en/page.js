import HomeView from '@/components/views/HomeView';
import { alternates } from '@/lib/i18n';

export const metadata = { alternates: alternates('en', '/') };

export default function Page() {
  return <HomeView lang="en" />;
}
