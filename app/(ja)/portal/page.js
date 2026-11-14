import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient, getClaims } from '@/lib/supabase/server';
import PortalHeader from '@/components/PortalHeader';
import { monthParam, monthRange, shiftMonth, jstDate, jstToday, yen } from '@/lib/dates';

export const metadata = { title: '提携店舗ポータル', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const STATUS = { published: '公開済み', paid: '支払済み', cancelled: '取消' };

export default async function Portal({ searchParams }) {
  const supabase = await createClient();
  const claims = await getClaims(supabase);
  if (!claims) redirect('/login');
  if (claims.aal !== 'aal2') redirect('/login/mfa');

  const { data: profile } = await supabase.from('profiles').select('role, partner_id').eq('id', claims.sub).single();
  if (profile?.role === 'admin') redirect('/admin');
  if (!profile?.partner_id) {
    return <p className="wrap section">このアカウントには提携店舗が登録されていません。株式会社鈴江までお問い合わせください。</p>;
  }

  const sp = await searchParams;
  const ym = monthParam(sp?.m);
  const { from, to } = monthRange(ym);

  const [{ data: partner }, { data: stores }, { data: chargeRows }, { data: rows }, { data: invoices }] = await Promise.all([
    supabase.from('partners').select('partner_code, name').eq('id', profile.partner_id).single(),
    supabase.from('store_numbers').select('store_no, note, valid_from, valid_to, discount_types(label, unit_yen)').order('store_no'),
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
      <PortalHeader title={`${partner?.name ?? ''}（${partner?.partner_code ?? ''}）`} email={claims.email} />

      <div className="grid">
        <div className="card stat">
          <span className="small muted">本日の認証件数</span>
          <span className="value">{todayCount}件</span>
        </div>
        <div className="card stat">
          <span className="small muted">{ym.replace('-', '年')}月の認証件数</span>
          <span className="value">{charge.validation_count}件</span>
        </div>
        <div className="card stat">
          <span className="small muted">認証額（単価×件数）</span>
          <span className="value">{yen(charge.gross_yen)}円</span>
        </div>
        <div className="card stat">
          <span className="small muted">ご請求見込み（割引率 {Math.round(Number(charge.volume_rate) * 100)}%・税込）</span>
          <span className="value">{yen(charge.total_yen)}円</span>
        </div>
      </div>
      <p className="small muted">当月の件数・金額は暫定値です。月末締め後に確定し、請求書でお知らせします。</p>

      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>日別の利用状況</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link className="chip" href={`/portal?m=${shiftMonth(ym, -1)}`}>
              ← 前月
            </Link>
            <Link className="chip" href={`/portal?m=${shiftMonth(ym, 1)}`}>
              翌月 →
            </Link>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">日付</th>
                <th scope="col" className="right">
                  件数
                </th>
                <th scope="col" className="right">
                  認証額
                </th>
              </tr>
            </thead>
            <tbody>
              {days.length === 0 && (
                <tr>
                  <td colSpan={3} className="muted">
                    この月の利用はまだありません。
                  </td>
                </tr>
              )}
              {days.map(([d, v]) => (
                <tr key={d}>
                  <td className="num">{d.replaceAll('-', '/')}</td>
                  <td className="right num">{v.count}</td>
                  <td className="right num">{yen(v.amount)}円</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid" style={{ marginTop: 16, alignItems: 'start' }}>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: 20 }}>認証機の設定</h2>
          <ul className="small" style={{ paddingLeft: 20 }}>
            {(stores || []).map((s) => (
              <li key={`${s.store_no}-${s.valid_from}`}>
                店No.{s.store_no}：{s.discount_types?.label}（{yen(s.discount_types?.unit_yen)}円）{s.note ? `・${s.note}` : ''}
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: 20 }}>請求書</h2>
          {(invoices || []).length === 0 ? (
            <p className="small muted">公開済みの請求書はまだありません。</p>
          ) : (
            <ul className="small" style={{ paddingLeft: 20 }}>
              {invoices.map((i) => (
                <li key={i.invoice_no}>
                  {i.invoice_no}・{yen(i.total_yen)}円・{STATUS[i.status] || i.status}
                  {i.due_on ? `・支払期限 ${i.due_on}` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
