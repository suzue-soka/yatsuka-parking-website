import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-guard';
import PortalHeader from '@/components/PortalHeader';
import { monthParam, monthRange, shiftMonth, jstDateTime, yen } from '@/lib/dates';
import { getAppLang } from '@/lib/app-lang';
import { appText } from '@/lib/content/app';

export async function generateMetadata() {
  return { title: appText(await getAppLang()).admin.metaTitle, robots: { index: false, follow: false } };
}
export const dynamic = 'force-dynamic';

export default async function AdminHome({ searchParams }) {
  const { supabase, claims } = await requireAdmin();
  const T = appText(await getAppLang());
  const t = T.admin;
  const sp = await searchParams;
  const ym = monthParam(sp?.m);
  const { from } = monthRange(ym);

  const [{ data: partners }, { data: runs }] = await Promise.all([
    supabase.from('partners').select('id, partner_code, name, status, store_numbers(store_no, note, discount_types(hours))').order('partner_code'),
    supabase.from('import_runs').select('id, started_at, status, period_from, period_to, rows_in_file, rows_added, rows_already_present, file_total_count, file_total_yen, message').order('id', { ascending: false }).limit(10),
  ]);

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
      <PortalHeader title={t.title} email={claims.email} links={[{ href: '/admin/import', label: t.importLink }]} logout={T.logout} />

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
              {(partners || []).map((p, i) => (
                <tr key={p.id}>
                  <td className="num">{p.partner_code}</td>
                  <td>{p.name}</td>
                  <td className="small">
                    {(p.store_numbers || [])
                      .map((s) => `${s.store_no}：${T.discount(s.discount_types?.hours)}${s.note ? `（${s.note}）` : ''}`)
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
        </div>
        <p className="small muted">{t.nextStage}</p>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: 20 }}>{t.runs}</h2>
        <div className="table-wrap">
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
        </div>
      </div>
    </section>
  );
}
