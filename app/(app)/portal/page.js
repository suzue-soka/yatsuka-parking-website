import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient, getClaims } from '@/lib/supabase/server';
import PortalHeader from '@/components/PortalHeader';
import { monthParam, monthRange, shiftMonth, jstDate, jstToday, yen } from '@/lib/dates';
import { getAppLang } from '@/lib/app-lang';
import { appText } from '@/lib/content/app';

export async function generateMetadata() {
  return { title: appText(await getAppLang()).portal.metaTitle, robots: { index: false, follow: false } };
}
export const dynamic = 'force-dynamic';

export default async function Portal({ searchParams }) {
  const supabase = await createClient();
  const T = appText(await getAppLang());
  const t = T.portal;
  const claims = await getClaims(supabase);
  if (!claims) redirect('/login');
  if (claims.aal !== 'aal2') redirect('/login/mfa');

  const { data: profile } = await supabase.from('profiles').select('role, partner_id').eq('id', claims.sub).single();
  if (profile?.role === 'admin') redirect('/admin');
  if (!profile?.partner_id) {
    return <p className="wrap section">{t.noPartner}</p>;
  }

  const sp = await searchParams;
  const ym = monthParam(sp?.m);
  const { from, to } = monthRange(ym);

  const [{ data: partner }, { data: stores }, { data: chargeRows }, { data: rows }, { data: invoices }] = await Promise.all([
    supabase.from('partners').select('partner_code, name').eq('id', profile.partner_id).single(),
    supabase.from('store_numbers').select('store_no, note, valid_from, valid_to, discount_types(hours, unit_yen)').order('store_no'),
    supabase.rpc('monthly_charge', { p_partner: profile.partner_id, p_month: from }),
    supabase.rpc('my_validations', { p_from: from, p_to: to }),
    supabase.from('invoices').select('invoice_no, kind, period_month, status, total_yen, due_on, issued_on').order('created_at', { ascending: false }).limit(24),
  ]);

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
      <PortalHeader title={`${partner?.name ?? ''}（${partner?.partner_code ?? ''}）`} email={claims.email} logout={T.logout} />

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
        </div>
      </div>

      <div className="grid" style={{ marginTop: 16, alignItems: 'start' }}>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: 20 }}>{t.machines}</h2>
          <ul className="small" style={{ paddingLeft: 20 }}>
            {(stores || []).map((s) => (
              <li key={`${s.store_no}-${s.valid_from}`}>
                {t.store(s.store_no)}：{T.discount(s.discount_types?.hours)}（{T.yen(yen(s.discount_types?.unit_yen ?? 0))}）{s.note ? `${t.sep}${s.note}` : ''}
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: 20 }}>{t.invoices}</h2>
          {(invoices || []).length === 0 ? (
            <p className="small muted">{t.noInvoices}</p>
          ) : (
            <ul className="small" style={{ paddingLeft: 20 }}>
              {invoices.map((i) => (
                <li key={i.invoice_no}>
                  {i.invoice_no}
                  {t.sep}
                  {T.yen(yen(i.total_yen))}
                  {t.sep}
                  {t.status[i.status] || i.status}
                  {i.due_on ? `${t.sep}${t.due(i.due_on)}` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
