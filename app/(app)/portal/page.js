import Link from 'next/link';
import SortableTable from '@/components/SortableTable';
import PortalHeader from '@/components/PortalHeader';
import { monthParam, monthRange, shiftMonth, jstDate, jstToday, yen } from '@/lib/dates';
import { getAppLang } from '@/lib/app-lang';
import { appText } from '@/lib/content/app';
import { requirePartner, portalLinks } from '@/lib/portal-guard';
import OnboardingCard from '@/components/OnboardingCard';

export async function generateMetadata() {
  return { title: appText(await getAppLang()).portal.metaTitle, robots: { index: false, follow: false } };
}
export const dynamic = 'force-dynamic';

export default async function Portal({ searchParams }) {
  const { supabase, claims, partner: me, T, O, lang } = await requirePartner('/portal');
  const t = T.portal;
  if (!me) {
    return <p className="wrap section">{t.noPartner}</p>;
  }
  const profile = { partner_id: me.id };

  const sp = await searchParams;
  const ym = monthParam(sp?.m);
  const { from, to } = monthRange(ym);

  const [{ data: partner }, { data: chargeRows }, { data: rows }, { data: invoices }, { data: payments }] = await Promise.all([
    supabase.from('partners').select('partner_code, name').eq('id', profile.partner_id).single(),
    supabase.rpc('monthly_charge', { p_partner: profile.partner_id, p_month: from }),
    supabase.rpc('my_validations', { p_from: from, p_to: to }),
    supabase.from('invoices').select('id, invoice_no, kind, period_month, status, total_yen, due_on, issued_on').order('created_at', { ascending: false }),
    supabase.from('payments').select('id, paid_on, method, amount_yen, invoices(invoice_no)').order('paid_on', { ascending: false }),
  ]);
  const B = O.billing;

  const charge = chargeRows?.[0] || { validation_count: 0, gross_yen: 0, volume_rate: 0, total_yen: 0 };
  const today = jstToday();
  const byDay = new Map();
  for (const r of rows || []) {
    const d = jstDate(r.paid_at);
    const cur = byDay.get(d) || { count: 0, amount: 0 };
    cur.count += r.quantity;
    cur.amount += r.quantity * r.unit_yen;
    byDay.set(d, cur);
  }
  const days = [...byDay.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  const todayCount = byDay.get(today)?.count || 0;

  return (
    <section className="wrap section">
      <PortalHeader title={`${partner?.name ?? ''}（${partner?.partner_code ?? ''}）`} email={claims.email} links={portalLinks(O)} />
      <OnboardingCard status={me.status} O={O} />

      <div className="grid">
        <div className="card stat">
          <span className="small muted">{t.today}</span>
          <span className="value">{T.count(todayCount)}</span>
        </div>
        <div className="card stat">
          <span className="small muted">{t.monthCount(T.month(ym))}</span>
          <span className="value">{T.count(charge.validation_count)}</span>
        </div>
        <div className="card stat">
          <span className="small muted">{t.gross}</span>
          <span className="value">{T.yen(yen(charge.gross_yen))}</span>
        </div>
        <div className="card stat">
          <span className="small muted">{t.estimate(Math.round(Number(charge.volume_rate) * 100))}</span>
          <span className="value">{T.yen(yen(charge.total_yen))}</span>
        </div>
      </div>
      <p className="small muted">{t.provisional}</p>

      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>{t.daily}</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link className="chip" href={`/portal?m=${shiftMonth(ym, -1)}`}>
              {T.prev}
            </Link>
            <Link className="chip" href={`/portal?m=${shiftMonth(ym, 1)}`}>
              {T.next}
            </Link>
          </div>
        </div>
        <div className="table-wrap">
          <SortableTable>
            <table>
              <thead>
                <tr>
                  <th scope="col">{t.th[0]}</th>
                  <th scope="col" className="right">
                    {t.th[1]}
                  </th>
                  <th scope="col" className="right">
                    {t.th[2]}
                  </th>
                </tr>
              </thead>
              <tbody>
                {days.length === 0 && (
                  <tr>
                    <td colSpan={3} className="muted">
                      {t.none}
                    </td>
                  </tr>
                )}
                {days.map(([d, v]) => (
                  <tr key={d}>
                    <td className="num">{d.replaceAll('-', '/')}</td>
                    <td className="right num">{v.count}</td>
                    <td className="right num">{T.yen(yen(v.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SortableTable>
        </div>
      </div>

      <div className="card table-wrap" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: 20 }}>{B.invoicesTitle}</h2>
        <SortableTable initial={0}>
          <table>
            <thead>
              <tr>
                {B.th.map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {(invoices || []).length === 0 && (
                <tr>
                  <td colSpan={7} className="muted">
                    {B.noInvoices}
                  </td>
                </tr>
              )}
              {(invoices || []).map((i) => (
                <tr key={i.id}>
                  <td className="num">{i.invoice_no}</td>
                  <td>{B.kinds[i.kind]}</td>
                  <td className="right num">{T.yen(yen(i.total_yen))}</td>
                  <td className="num">{i.issued_on || '—'}</td>
                  <td className="num">{i.due_on || '—'}</td>
                  <td className={i.status === 'paid' ? 'ok' : i.status === 'published' ? 'warn' : undefined}>{B.invStatus[i.status]}</td>
                  <td>
                    <Link href={`/portal/invoices/${i.id}`}>{B.view}</Link>
                    {' ・ '}
                    <a href={`/portal/invoices/${i.id}/pdf`} download>
                      PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SortableTable>
      </div>

      <div className="card table-wrap" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: 20 }}>{B.paymentsTitle}</h2>
        <SortableTable>
          <table>
            <thead>
              <tr>
                {B.pth.map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(payments || []).length === 0 && (
                <tr>
                  <td colSpan={4} className="muted">
                    {B.noPayments}
                  </td>
                </tr>
              )}
              {(payments || []).map((x) => (
                <tr key={x.id}>
                  <td className="num">{x.paid_on}</td>
                  <td className="num">{x.invoices?.invoice_no}</td>
                  <td>{B.methods[x.method]}</td>
                  <td className="right num">{T.yen(yen(x.amount_yen))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SortableTable>
      </div>
    </section>
  );
}
