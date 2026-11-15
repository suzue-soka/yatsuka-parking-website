import { notFound, redirect } from 'next/navigation';
import { createClient, getClaims } from '@/lib/supabase/server';
import PrintButton from '@/components/PrintButton';
import IdleWatch from '@/components/IdleWatch';
import { getAppLang } from '@/lib/app-lang';
import { appText } from '@/lib/content/app';
import { onbText } from '@/lib/content/onboarding';
import { yen } from '@/lib/dates';

export const dynamic = 'force-dynamic';
export async function generateMetadata() {
  return { title: onbText(await getAppLang()).invoice.title, robots: { index: false, follow: false } };
}

// Qualified invoice (適格請求書), printable from the browser. Partners see their own; admins see all (RLS).
export default async function Invoice({ params }) {
  const supabase = await createClient();
  const claims = await getClaims(supabase);
  const { id } = await params;
  if (!claims) redirect(`/login?next=/portal/invoices/${id}`);
  if (claims.aal !== 'aal2') redirect(`/login/mfa?next=/portal/invoices/${id}`);
  const lang = await getAppLang();
  const T = appText(lang);
  const I = onbText(lang).invoice;

  const { data: inv } = await supabase
    .from('invoices')
    .select('*, invoice_lines(description, quantity, unit_yen, amount_yen), partners(partner_code, name, billing_name, billing_address, address)')
    .eq('id', id)
    .maybeSingle();
  if (!inv) notFound();
  const p = inv.partners || {};
  const lines = inv.invoice_lines || [];
  const Y = (n) => T.yen(yen(n));

  return (
    <section className="wrap section" style={{ maxWidth: 820 }}>
      <IdleWatch />
      <p className="no-print">
        <PrintButton label={I.print} />
      </p>
      <div className="card invoice" lang="ja">
        <div className="invoice-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo-lockup.svg" alt="谷塚駅東口共同駐車場" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28 }}>
              {I.title}
              {inv.status === 'paid' && <span className="status-pill" style={{ marginLeft: 12, verticalAlign: 'middle' }}>{I.receipt}</span>}
            </h1>
            <p style={{ fontSize: 18, margin: '16px 0 4px' }}>
              <strong>{I.to(p.billing_name || p.name)}</strong>
            </p>
            <p className="small" style={{ margin: 0 }}>
              {p.billing_address || p.address}
              <br />
              {I.partnerId}：{p.partner_code}
            </p>
          </div>
          <div className="small" style={{ textAlign: 'right' }}>
            <p style={{ margin: 0 }}>
              {I.no}：<strong className="num">{inv.invoice_no}</strong>
              <br />
              {I.issued}：{inv.issued_on}
              <br />
              {I.due}：{inv.due_on || '—'}
            </p>
            <p style={{ margin: '12px 0 0' }}>
              <strong>{I.issuer}</strong>
              <br />
              {I.issuerAddress}
              <br />
              TEL 048-924-2401
              <br />
              {I.regNo}
            </p>
          </div>
        </div>

        <p style={{ fontSize: 20, margin: '24px 0 8px' }}>
          {I.total}：<strong className="num" style={{ fontSize: 28 }}>{Y(inv.total_yen)}</strong>
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">{I.th[0]}</th>
                <th scope="col" className="right">
                  {I.th[1]}
                </th>
                <th scope="col" className="right">
                  {I.th[2]}
                </th>
                <th scope="col" className="right">
                  {I.th[3]}
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i}>
                  <td style={{ whiteSpace: 'normal' }}>{l.description}</td>
                  <td className="right num">{l.quantity}</td>
                  <td className="right num">{Y(l.unit_yen)}</td>
                  <td className="right num">{Y(l.amount_yen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small">{I.taxLine(Y(inv.total_yen), Y(inv.tax_yen))}</p>
        <p className="small" style={{ marginBottom: 0 }}>
          {I.bank}
          <br />
          {onbText(lang).billing.transferName(p.partner_code)}
        </p>
      </div>
    </section>
  );
}
