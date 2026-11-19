import { guideText } from '@/lib/content/guide';
import Link from 'next/link';
import SortableTable from '@/components/SortableTable';
import { requireAdmin } from '@/lib/admin-guard';
import PortalHeader from '@/components/PortalHeader';
import { monthParam, monthRange, shiftMonth, jstDateTime, yen } from '@/lib/dates';
import { getAppLang } from '@/lib/app-lang';
import { appText } from '@/lib/content/app';
import { onbText } from '@/lib/content/onboarding';
import { adminLinks } from '@/lib/admin-links';
import { billingText } from '@/lib/content/billing';
import { markAllAmanoOrdered } from './actions';
import ConfirmButton from '@/components/ConfirmButton';
import Notice from '@/components/Notice';
import { jstToday } from '@/lib/dates';

export async function generateMetadata() {
  return { title: appText(await getAppLang()).admin.metaTitle, robots: { index: false, follow: false } };
}
export const dynamic = 'force-dynamic';

export default async function AdminHome({ searchParams }) {
  const { supabase, claims } = await requireAdmin();
  const lang = await getAppLang();
  const T = appText(lang);
  const t = T.admin;
  const o = onbText(lang).admin;
  const sp = await searchParams;
  const ym = monthParam(sp?.m);
  const { from } = monthRange(ym);

  const [{ data: allPartners }, { data: runs }, { count: openInquiries }, { count: pendingChanges }, { data: amanoWaiting }, { data: unpaidMachineInvoices }, { data: unshipped }, { data: pendingRequests }, { count: draftCount }, { count: openReports }] = await Promise.all([
    supabase.from('partners').select('id, partner_code, name, status, store_numbers(store_no, note, discount_types(hours, unit_yen))').order('partner_code'),
    supabase.from('import_runs').select('id, started_at, status, period_from, period_to, rows_in_file, rows_added, rows_already_present, file_total_count, file_total_yen, message').order('id', { ascending: false }).limit(10),
    supabase.from('inquiries').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('change_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('machines').select('id, machine_code').not('machine_code', 'is', null).is('shipped_on', null).is('cancelled_at', null).is('amano_ordered_on', null).order('machine_code'),
    supabase.from('invoices').select('partner_id').eq('kind', 'equipment').eq('status', 'published'),
    // Paid machines not shipped yet — also additional machines of partners already 利用中.
    supabase.from('machines').select('partner_id').not('machine_code', 'is', null).is('shipped_on', null).is('cancelled_at', null),
    supabase.from('machine_requests').select('partner_id').eq('kind', 'additional').eq('status', 'pending'),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('kind', 'monthly').eq('status', 'draft'),
    supabase.from('machine_reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
  ]);
  const toShip = new Set((unshipped || []).map((m) => m.partner_id)).size;
  const awaitingPayment = new Set((unpaidMachineInvoices || []).map((i) => i.partner_id)).size;
  const partners = (allPartners || []).filter((p) => p.partner_code && ['active', 'suspended', 'shipped'].includes(p.status));
  const byStatus = (st) => (allPartners || []).filter((p) => p.status === st).length;
  const todo = [
    { label: o.counts.applied, n: byStatus('applied'), href: '/admin/partners?status=applied' },
    { label: billingText(lang).todoDrafts, n: draftCount ?? 0, href: '/admin/billing' },
    { label: o.counts.machineRequests, n: new Set((pendingRequests || []).map((r) => r.partner_id)).size, href: '/admin/partners?status=machine_request' },
    { label: o.counts.awaiting_payment, n: awaitingPayment, href: '/admin/partners?status=awaiting_payment' },
    { label: o.counts.preparing, n: toShip, href: '/admin/partners?status=preparing' },
    { label: o.counts.inquiries, n: openInquiries ?? 0, href: '/admin/requests' },
    { label: o.counts.changes, n: pendingChanges ?? 0, href: '/admin/requests' },
    { label: guideText(lang).admin.count, n: openReports ?? 0, href: '/admin/requests' },
  ];

  const charges = await Promise.all(
    (partners || []).map(async (p) => {
      const { data } = await supabase.rpc('monthly_charge', { p_partner: p.id, p_month: from });
      return data?.[0] || { validation_count: 0, gross_yen: 0, volume_rate: 0, total_yen: 0 };
    }),
  );
  const totalCount = charges.reduce((s, c) => s + c.validation_count, 0);
  const totalYen = charges.reduce((s, c) => s + c.total_yen, 0);

  return (
    <section className="wrap section">
      <PortalHeader title={t.title} email={claims.email} links={adminLinks(lang)} />

      <h2 style={{ fontSize: 20 }}>{o.todo}</h2>
      <div className="grid compact" style={{ marginBottom: 16 }}>
        {todo.map((x) => (
          <Link key={x.label} href={x.href} className={`card stat${x.n ? ' attention' : ''}`} style={{ textDecoration: 'none' }}>
            <span className="small muted">{x.label}</span>
            <span className="value">{x.n}</span>
          </Link>
        ))}
      </div>

      <Notice sp={sp} o={onbText(lang)} extra={{ amanoOrdered: o.amanoOrderedDone }} />
      {(amanoWaiting || []).length > 0 && (
        <div className="card" style={{ marginBottom: 16, borderColor: 'var(--orange)' }}>
          <h2 style={{ marginTop: 0, fontSize: 20 }}>{o.amanoBatchTitle(amanoWaiting.length)}</h2>
          <p className="small" style={{ marginTop: 0 }}>
            {amanoWaiting.map((m) => m.machine_code).join('、')}
          </p>
          <p className="small muted">{o.amanoBatchHint}</p>
          <p>
            <a className="btn btn-line" href={`/admin/setup-request?ids=${amanoWaiting.map((m) => m.id).join(',')}`} target="_blank" rel="noopener">
              {o.setupRequest}
            </a>
          </p>
          <form action={markAllAmanoOrdered} className="form" style={{ marginBottom: 0 }}>
            {amanoWaiting.map((m) => (
              <input key={m.id} type="hidden" name="ids" value={m.id} />
            ))}
            <label htmlFor="amano_all_date">{o.amanoOrderedOn}</label>
            <input id="amano_all_date" name="date" type="date" required defaultValue={jstToday()} max={jstToday()} />
            <ConfirmButton className="btn btn-primary" message={o.amanoOrderedConfirm}>
              {o.amanoOrdered}
            </ConfirmButton>
          </form>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>
            {t.byPartner(T.month(ym))}
          </h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link className="chip" href={`/admin?m=${shiftMonth(ym, -1)}`}>
              {T.prev}
            </Link>
            <Link className="chip" href={`/admin?m=${shiftMonth(ym, 1)}`}>
              {T.next}
            </Link>
          </div>
        </div>
        <div className="table-wrap">
          <SortableTable initial={0}>
            <table>
              <thead>
                <tr>
                  <th scope="col">{t.th[0]}</th>
                  <th scope="col">{t.th[1]}</th>
                  <th scope="col">{t.th[2]}</th>
                  {t.th.slice(3).map((h) => (
                    <th key={h} scope="col" className="right">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {partners.map((p, i) => (
                  <tr key={p.id}>
                    <td className="num">{p.partner_code}</td>
                    <td>{p.name}</td>
                    <td className="small">
                      {(p.store_numbers || [])
                        .map((s) => `${s.store_no}：${T.yen(yen(s.discount_types?.unit_yen))}${s.note ? `（${s.note}）` : ''}` /* price per validation (owner, 2026-11-16) */)
                        .join(' / ')}
                    </td>
                    <td className="right num">{charges[i].validation_count}</td>
                    <td className="right num">{T.yen(yen(charges[i].gross_yen))}</td>
                    <td className="right num">{Math.round(Number(charges[i].volume_rate) * 100)}%</td>
                    <td className="right num">
                      <strong>{T.yen(yen(charges[i].total_yen))}</strong>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3}>
                    <strong>{t.total}</strong>
                  </td>
                  <td className="right num">
                    <strong>{totalCount}</strong>
                  </td>
                  <td />
                  <td />
                  <td className="right num">
                    <strong>{T.yen(yen(totalYen))}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </SortableTable>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: 20 }}>{t.runs}</h2>
        <div className="table-wrap">
          <SortableTable>
            <table>
              <thead>
                <tr>
                  <th scope="col">{t.runTh[0]}</th>
                  <th scope="col">{t.runTh[1]}</th>
                  <th scope="col">{t.runTh[2]}</th>
                  {t.runTh.slice(3, 6).map((h) => (
                    <th key={h} scope="col" className="right">
                      {h}
                    </th>
                  ))}
                  <th scope="col">{t.runTh[6]}</th>
                </tr>
              </thead>
              <tbody>
                {(runs || []).length === 0 && (
                  <tr>
                    <td colSpan={7} className="muted">
                      {t.noRuns}
                    </td>
                  </tr>
                )}
                {(runs || []).map((r) => (
                  <tr key={r.id}>
                    <td className="num">{jstDateTime(r.started_at)}</td>
                    <td className={r.status === 'ok' ? 'ok' : 'warn'}>{t.run[r.status] || r.status}</td>
                    <td className="num small">
                      {r.period_from ? `${jstDateTime(r.period_from)} 〜 ${jstDateTime(r.period_to)}` : '—'}
                    </td>
                    <td className="right num">{r.rows_in_file ?? '—'}</td>
                    <td className="right num">{r.rows_added ?? '—'}</td>
                    <td className="right num">{r.rows_already_present ?? '—'}</td>
                    <td className="small" style={{ whiteSpace: 'normal' }}>
                      {r.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SortableTable>
        </div>
      </div>
      <p className="small" style={{ marginTop: 16 }}>{guideText(lang).admin.amsLine}</p>
    </section>
  );
}
