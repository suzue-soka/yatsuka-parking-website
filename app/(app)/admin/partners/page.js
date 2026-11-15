import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-guard';
import PortalHeader from '@/components/PortalHeader';
import Notice from '@/components/Notice';
import { getAppLang } from '@/lib/app-lang';
import { appText } from '@/lib/content/app';
import { onbText } from '@/lib/content/onboarding';
import { programText } from '@/lib/content/program';
import { adminLinks } from '@/lib/admin-links';
import { jstDate } from '@/lib/dates';

export const dynamic = 'force-dynamic';
export async function generateMetadata() {
  return { title: onbText(await getAppLang()).admin.partners, robots: { index: false, follow: false } };
}

const FILTERS = ['applied', 'approved', 'awaiting_payment', 'preparing', 'shipped', 'active', 'rejected'];

export default async function AdminPartners({ searchParams }) {
  const { supabase, claims } = await requireAdmin();
  const lang = await getAppLang();
  const T = appText(lang);
  const O = onbText(lang);
  const P = programText(lang);
  const sp = await searchParams;
  const status = FILTERS.includes(sp?.status) ? sp.status : null;

  let q = supabase.from('partners').select('id, partner_code, name, category, status, created_at').order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data: rows } = await q;

  return (
    <section className="wrap section">
      <PortalHeader title={O.admin.partners} email={claims.email} links={adminLinks(lang)} logout={T.logout} />
      <Notice sp={sp} o={O} extra={{ invited: `${sp?.name ? `${sp.name}：` : ''}${O.admin.invited}`, rejected: O.admin.rejectedDone }} />
      <div className="chips" style={{ marginBottom: 12 }}>
        <Link className={`chip${status ? '' : ' active'}`} href="/admin/partners">
          {O.admin.all}
        </Link>
        {FILTERS.map((f) => (
          <Link key={f} className={`chip${status === f ? ' active' : ''}`} href={`/admin/partners?status=${f}`}>
            {O.status[f]}
          </Link>
        ))}
      </div>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              {O.admin.th.map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(rows || []).length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  {O.admin.none}
                </td>
              </tr>
            )}
            {(rows || []).map((r) => (
              <tr key={r.id}>
                <td className="num">{r.partner_code || '—'}</td>
                <td>
                  <Link href={`/admin/partners/${r.id}`}>{r.name}</Link>
                </td>
                <td>{P.categories[r.category] || r.category || '—'}</td>
                <td>
                  <span className="status-pill">{O.status[r.status] || r.status}</span>
                </td>
                <td className="num">{jstDate(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
