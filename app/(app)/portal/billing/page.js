import Link from 'next/link';
import PortalHeader from '@/components/PortalHeader';
import Notice from '@/components/Notice';
import MachineOrderForm from '@/components/MachineOrderForm';
import { getAppLang } from '@/lib/app-lang';
import { onbText } from '@/lib/content/onboarding';
import { requirePartner, portalLinks } from '@/lib/portal-guard';
import { yen } from '@/lib/dates';
import ShipmentInfo from '@/components/ShipmentInfo';
import { orderMachine } from '../actions';

export const dynamic = 'force-dynamic';
export async function generateMetadata() {
  return { title: onbText(await getAppLang()).billing.title, robots: { index: false, follow: false } };
}

export default async function Billing({ searchParams }) {
  const { supabase, claims, partner: p, T, O, lang } = await requirePartner('/portal/billing');
  if (!p) return <p className="wrap section">{T.portal.noPartner}</p>;
  const B = O.billing;
  const sp = await searchParams;
  const [{ data: price }, { data: invoices }, { data: payments }, { data: machines }] = await Promise.all([
    supabase.from('price_list').select('unit_yen').eq('code', 'qr_validator').single(),
    supabase.from('invoices').select('id, invoice_no, kind, status, total_yen, issued_on, due_on').order('created_at', { ascending: false }),
    supabase.from('payments').select('id, paid_on, method, amount_yen, invoices(invoice_no)').order('paid_on', { ascending: false }),
    supabase.from('machines').select('*').order('id'),
  ]);
  const unpaid = (invoices || []).some((i) => i.status === 'published');
  const unpaidEquipment = (invoices || []).some((i) => i.kind === 'equipment' && i.status === 'published');

  return (
    <section className="wrap section">
      <PortalHeader title={B.title} email={claims.email} links={portalLinks(O)} />
      <Notice sp={sp} o={O} />

      <div className="grid" style={{ alignItems: 'start' }}>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: 20 }}>{B.machineTitle}</h2>
          {['approved', 'preparing', 'shipped', 'active'].includes(p.status) && !unpaidEquipment && (
            <>
              <p>{p.status !== 'approved' ? B.orderMoreText(T.yen(yen(price?.unit_yen ?? 40000))) : B.orderText(T.yen(yen(price?.unit_yen ?? 40000)))}</p>
              <MachineOrderForm
                action={orderMachine}
                unitYen={price?.unit_yen ?? 40000}
                defaults={p.requested_discounts || []}
                labels={{ ...B.orderForm, discount: T.discount('{h}'), yenFormat: T.yen('{n}'), confirm: B.orderConfirm, submit: p.status !== 'approved' ? B.orderMore : B.order }}
              />
            </>
          )}
          {p.status === 'applied' && <p className="muted">{B.notYet}</p>}
          {['awaiting_payment', 'preparing', 'shipped'].includes(p.status) && (
            <p>
              <strong>{O.status[p.status]}</strong>：{O.onboarding.next[p.status]}
            </p>
          )}
          {(machines || []).map((m) => (
            <ShipmentInfo key={m.id} machine={m} lang={lang} />
          ))}
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: 20 }}>{B.bankTitle}</h2>
          <p>
            <strong>{B.bank}</strong>
          </p>
          <p className="small">{B.transferName(p.partner_code)}</p>
          <p className="small muted" style={{ marginBottom: 0 }}>
            {B.card}
          </p>
          {unpaid && <p className="small warn">{B.invStatus.published}</p>}
        </div>
      </div>

      <div className="card table-wrap" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: 20 }}>{B.invoicesTitle}</h2>
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
      </div>

      <div className="card table-wrap" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: 20 }}>{B.paymentsTitle}</h2>
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
      </div>
    </section>
  );
}
