import PartnerTermsView from '@/components/views/PartnerTermsView';
import { programText } from '@/lib/content/program';
import { alternates } from '@/lib/i18n';

export const metadata = {
  title: programText('en').termsTitle,
  alternates: alternates('en', '/partners/terms'),
  robots: { index: false },
};

export default function Page() {
  return <PartnerTermsView lang="en" />;
}
