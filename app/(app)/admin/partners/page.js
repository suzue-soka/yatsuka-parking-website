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

const FILTERS = ['applied', 'machine_request', 'approved', 'awaiting_payment', 'preparing', 'active', 'rejected'];
// Sortable columns, in the same order as O.admin.th. Status sorts by workflow order, not alphabetically.
const COLS = ['partner_code', 'name', 'category', 'status', 'created_at'];
const STATUS_ORDER = ['applied', 'approved', 'awaiting_payment', 'preparing', 'shipped', 'active', 'rejected'];

export default async function AdminPartners({ searchParams }) {
  const { supabase, claims } = await requireAdmin();
  const lang = await getAppLang();
  const T = appText(lang);
  const O = onbText(lang);
  const P = programText(lang);
  const sp = await searchParams;
  const status = FILTERS.includes(sp?.status) ? sp.status : null;

  let q = supabase.from('partners').select('id, partner_code, name, category, status, created_at').order('created_at', { ascending: false });
  if (status === 'awaiting_payment') {
    // Any partner with an unpaid machine invoice, including additional orders from partners already preparing or active.
    const { data: unpaid } = await supabase.from('invoices').select('partner_id').eq('kind', 'equipment').eq('status', 'published');
    q = q.in('id', [...new Set((unpaid || []).map((i) => i.partner_id))]);
  } else if (status === 'machine_request') {
    // Partners with a request for extra machines waiting for approval.
    const { data: reqs } = await supabase.from('machine_requests').select('partner_id').eq('kind', 'additional').eq('status', 'pending');
    q = q.in('id', [...new Set((reqs || []).map((r) => r.partner_id))]);
  } else if (status === 'preparing') {
    // Any partner with a paid machine not shipped yet, including additional machines of active partners.
    const { data: waiting } = await supabase.from('machines').select('partner_id').not('machine_code', 'is', null).is('shipped_on', null).is('cancelled_at', null);
    q = q.in('id', [...new Set((waiting || []).map((m) => m.partner_id))]);
  } else if (status) q = q.eq('status', status);
  const { data: list } = await q;

  const sort = COLS.includes(sp?.sort) ? sp.sort : 'partner_code';
  const dir = sp?.dir === 'asc' || sp?.dir === 'desc' ? sp.dir : sort === 'created_at' ? 'desc' : 'asc';
  const keyOf = (r) =>
    sort === 'status' ? STATUS_ORDER.indexOf(r.status) : sort === 'category' ? P.categories[r.category] || r.category || '' : r[sort] ?? '';
  const rows = [...(list || [])].sort((a, b) => {
    const x = keyOf(a), y = keyOf(b);
    if (x === '' && y !== '') return 1; // empty values (e.g. no ID yet) always last
    if (y === '' && x !== '') return -1;
    const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'ja', { numeric: true });
    if (c) return dir === 'asc' ? c : -c;
    return String(a.partner_code || '~').localeCompare(String(b.partner_code || '~'), 'ja', { numeric: true }); // ties: by partner ID
  });
  const sortHref = (col) => {
    const qs = new URLSearchParams();
    if (status) qs.set('status', status);
    qs.set('sort', col);
    qs.set('dir', col === sort ? (dir === 'asc' ? 'desc' : 'asc') : col === 'created_at' ? 'desc' : 'asc');
    return `/admin/partners?${qs}`;
  };
  const chipHref = (f) => {
    const qs = new URLSearchParams();
    if (f) qs.set('status', f);
    if (sp?.sort) { qs.set('sort', sort); qs.set('dir', dir); }
    const t = qs.toString();
    return t ? `/admin/partners?${t}` : '/admin/partners';
  };

  return (
    <section className="wrap section">
      <PortalHeader title={O.admin.partners} email={claims.email} links={adminLinks(lang)} />
      <Notice sp={sp} o={O} extra={{ invited: `${sp?.name ? `${sp.name}：` : ''}${O.admin.invited}`, rejected: O.admin.rejectedDone }} />
      <div className="chips" style={{ marginBottom: 12 }}>
        <Link className={`chip${status ? '' : ' active'}`} href={chipHref(null)}>
          {O.admin.all}
        </Link>
        {FILTERS.map((f) => (
          <Link key={f} className={`chip${status === f ? ' active' : ''}`} href={chipHref(f)}>
            {O.status[f]}
          </Link>
        ))}
      </div>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              {O.admin.th.map((h, i) => (
                <th key={h} scope="col" aria-sort={COLS[i] === sort ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  <Link className="th-sort" href={sortHref(COLS[i])}>
                    {h}
                    <span aria-hidden="true">{COLS[i] === sort ? (dir === 'asc' ? ' ▲' : ' ▼') : ''}</span>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  {O.admin.none}
                </td>
              </tr>
            )}
            {rows.map((r) => (
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
