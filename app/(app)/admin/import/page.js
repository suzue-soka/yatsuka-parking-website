import { requireAdmin } from '@/lib/admin-guard';
import PortalHeader from '@/components/PortalHeader';
import ImportForm from './ImportForm';
import { getAppLang } from '@/lib/app-lang';
import { appText } from '@/lib/content/app';
import { adminLinks } from '@/lib/admin-links';

export async function generateMetadata() {
  return { title: appText(await getAppLang()).import.title, robots: { index: false, follow: false } };
}
export const dynamic = 'force-dynamic';

export default async function ImportPage() {
  const { claims } = await requireAdmin();
  const lang = await getAppLang();
  const T = appText(lang);
  const t = T.import;
  return (
    <section className="wrap section">
      <PortalHeader title={t.title} email={claims.email} links={adminLinks(lang)} logout={T.logout} />
      <ImportForm />
      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>{t.rulesTitle}</h2>
        <ul className="small">
          {t.rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
