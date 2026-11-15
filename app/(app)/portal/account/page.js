import PortalHeader from '@/components/PortalHeader';
import AccountForms from '@/components/AccountForms';
import { getAppLang } from '@/lib/app-lang';
import { onbText } from '@/lib/content/onboarding';
import { requirePartner, portalLinks } from '@/lib/portal-guard';

export const dynamic = 'force-dynamic';
export async function generateMetadata() {
  return { title: onbText(await getAppLang()).account.title, robots: { index: false, follow: false } };
}

export default async function Account() {
  const { claims, T, O } = await requirePartner('/portal/account');
  const A = O.account;
  return (
    <section className="wrap section">
      <PortalHeader title={A.title} email={claims.email} links={portalLinks(O)} />
      <AccountForms email={claims.email} />
      <div className="card" style={{ marginTop: 16 }}>
        <p className="small" style={{ margin: 0 }}>{A.mfa}</p>
        <p className="small" style={{ margin: '8px 0 0' }}>{A.language}</p>
      </div>
    </section>
  );
}
