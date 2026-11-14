import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-guard';
import PortalHeader from '@/components/PortalHeader';
import { monthParam, monthRange, shiftMonth, jstDateTime, yen } from '@/lib/dates';

export const metadata = { title: '管理画面', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const RUN = { ok: '完了', running: '処理中', failed: '失敗', blocked: '要確認（取込中止）' };

export default async function AdminHome({ searchParams }) {
  const { supabase, claims } = await requireAdmin();
  const sp = await searchParams;
  const ym = monthParam(sp?.m);
  const { from } = monthRange(ym);

  const [{ data: partners }, { data: runs }] = await Promise.all([
    supabase.from('partners').select('id, partner_code, name, status, store_numbers(store_no, note, discount_types(label))').order('partner_code'),
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
      <PortalHeader title="管理画面" email={claims.email} links={[{ href: '/admin/import', label: 'ParkingWeb 取込' }]} />

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>
            {ym.replace('-', '年')}月の提携店舗別 認証件数・請求見込み
          </h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link className="chip" href={`/admin?m=${shiftMonth(ym, -1)}`}>
              ← 前月
            </Link>
            <Link className="chip" href={`/admin?m=${shiftMonth(ym, 1)}`}>
              翌月 →
            </Link>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">提携店舗ID</th>
                <th scope="col">店舗名</th>
                <th scope="col">店No.・割引</th>
                <th scope="col" className="right">
                  件数
                </th>
                <th scope="col" className="right">
                  認証額
                </th>
                <th scope="col" className="right">
                  割引率
                </th>
                <th scope="col" className="right">
                  請求見込み（税込）
                </th>
              </tr>
            </thead>
            <tbody>
              {(partners || []).map((p, i) => (
                <tr key={p.id}>
                  <td className="num">{p.partner_code}</td>
                  <td>{p.name}</td>
                  <td className="small">
                    {(p.store_numbers || [])
                      .map((s) => `${s.store_no}：${s.discount_types?.label}${s.note ? `（${s.note}）` : ''}`)
                      .join(' / ')}
                  </td>
                  <td className="right num">{charges[i].validation_count}</td>
                  <td className="right num">{yen(charges[i].gross_yen)}円</td>
                  <td className="right num">{Math.round(Number(charges[i].volume_rate) * 100)}%</td>
                  <td className="right num">
                    <strong>{yen(charges[i].total_yen)}円</strong>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={3}>
                  <strong>合計</strong>
                </td>
                <td className="right num">
                  <strong>{totalCount}</strong>
                </td>
                <td />
                <td />
                <td className="right num">
                  <strong>{yen(totalYen)}円</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="small muted">請求書の作成・承認・公開の画面は次の段階で追加します。</p>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: 20 }}>最近の取込</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">日時</th>
                <th scope="col">結果</th>
                <th scope="col">対象期間</th>
                <th scope="col" className="right">
                  ファイル行数
                </th>
                <th scope="col" className="right">
                  追加
                </th>
                <th scope="col" className="right">
                  取込済み
                </th>
                <th scope="col">メモ</th>
              </tr>
            </thead>
            <tbody>
              {(runs || []).length === 0 && (
                <tr>
                  <td colSpan={7} className="muted">
                    まだ取込はありません。
                  </td>
                </tr>
              )}
              {(runs || []).map((r) => (
                <tr key={r.id}>
                  <td className="num">{jstDateTime(r.started_at)}</td>
                  <td className={r.status === 'ok' ? 'ok' : 'warn'}>{RUN[r.status] || r.status}</td>
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
