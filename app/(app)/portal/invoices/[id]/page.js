import { notFound, redirect } from 'next/navigation';
import { createClient, getClaims } from '@/lib/supabase/server';
import PrintButton from '@/components/PrintButton';
import IdleWatch from '@/components/IdleWatch';
import { getAppLang } from '@/lib/app-lang';
import { onbText } from '@/lib/content/onboarding';
import { yen, periodRange } from '@/lib/dates';

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
  // The document itself is always in Japanese, like the PDF; only the buttons follow the viewer's language.
  const I = onbText('ja').invoice;
  const L = onbText(lang).invoice;

  const { data: inv } = await supabase
    .from('invoices')
    .select('*, invoice_lines(description, quantity, unit_yen, amount_yen), partners(partner_code, name, billing_name, billing_address, address)')
    .eq('id', id)
    .maybeSingle();
  if (!inv) notFound();
  const p = inv.partners || {};
  const lines = inv.invoice_lines || [];
  const Y = (n) => `${yen(n)}円`;
  const isCn = inv.kind === 'cancellation';
  // Drafts have no number or issue date yet: view only, never printed or downloaded.
  const isDraft = inv.status === 'draft';
  const { data: orig } = isCn && inv.cancels_invoice_id
    ? await supabase.from('invoices').select('invoice_no, issued_on').eq('id', inv.cancels_invoice_id).maybeSingle()
    : { data: null };

  return (
    <section className="wrap section" style={{ maxWidth: 860 }}>
      <IdleWatch />
      {isDraft ? (
        <p className="alert no-print">{L.draftNote}</p>
      ) : (
        <p className="no-print">
          <PrintButton label={L.print} />{' '}
          <a className="btn btn-line" href={`/portal/invoices/${id}/pdf`} download>
            {L.pdf}
          </a>
        </p>
      )}
      <article className={`doc${isDraft ? ' doc-draft' : ''}`} lang="ja">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="doc-logo" src="/images/logo-lockup.svg" alt="谷塚駅東口共同駐車場" />

        <div className="doc-head">
          <h1 className="doc-title">
            {isCn ? I.cnTitle : I.title}
            {!isCn && inv.status === 'paid' && <span className="doc-stamp">{I.receipt}</span>}
            {inv.status === 'cancelled' && <span className="doc-stamp">{I.cancelledStamp}</span>}
            {isDraft && <span className="doc-stamp">{I.draftStamp}</span>}
          </h1>
          <dl className="doc-meta">
            <div>
              <dt>{I.no}</dt>
              <dd>{isDraft ? I.atPublish : inv.invoice_no}</dd>
            </div>
            {inv.period_month && (
              <div>
                <dt>{I.period}</dt>
                <dd>{periodRange(inv.period_month)}</dd>
              </div>
            )}
            <div>
              <dt>{I.issued}</dt>
              <dd>{isDraft ? I.atPublish : inv.issued_on || '—'}</dd>
            </div>
            <div>
              <dt>{I.due}</dt>
              <dd>{isDraft ? I.atPublish : inv.due_on || '—'}</dd>
            </div>
          </dl>
        </div>

        <div className="doc-parties">
          <div className="doc-to">
            <p className="doc-to-name">{I.to(p.billing_name || p.name || '')}</p>
            <p className="doc-small">
              {p.billing_address || p.address}
              <br />
              {I.partnerId}：{p.partner_code}
            </p>
          </div>
          <div className="doc-from">
            <p className="doc-from-name">{I.issuer}</p>
            <p className="doc-small">
              {I.issuerAddress}
              <br />
              TEL 048-924-2401
              <br />
              {I.regNo}
            </p>
          </div>
        </div>

        <div className="doc-total">
          <span>{I.total}</span>
          <strong>{Y(inv.total_yen)}</strong>
        </div>

        <table className="doc-table">
          <thead>
            <tr>
              <th scope="col">{I.th[0]}</th>
              <th scope="col">{I.th[1]}</th>
              <th scope="col">{I.th[2]}</th>
              <th scope="col">{I.th[3]}</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i}>
                <td>{l.description}</td>
                <td>{l.quantity}</td>
                <td>{Y(l.unit_yen)}</td>
                <td>{Y(l.amount_yen)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="doc-tax">{I.taxLine(Y(inv.total_yen), Y(inv.tax_yen))}</p>

        {isCn ? (
          <p className="doc-pay">{I.cancels(orig?.invoice_no || '—', orig?.issued_on || '—')}</p>
        ) : (
          inv.status !== 'cancelled' && (
            <div className="doc-pay">
              <p className="doc-bank">{I.bank}</p>
              <p className="doc-small">{onbText('ja').billing.transferName(p.partner_code)}</p>
            </div>
          )
        )}
        <p className="doc-foot">{I.issuer}</p>
      </article>
    </section>
  );
}
