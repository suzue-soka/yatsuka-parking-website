import Link from 'next/link';
import SortableTable from '@/components/SortableTable';
import PortalHeader from '@/components/PortalHeader';
import Notice from '@/components/Notice';
import MachineOrderForm from '@/components/MachineOrderForm';
import { getAppLang } from '@/lib/app-lang';
import { onbText } from '@/lib/content/onboarding';
import { requirePartner, portalLinks } from '@/lib/portal-guard';
import { yen } from '@/lib/dates';
import ShipmentInfo from '@/components/ShipmentInfo';
import { requestMachines, orderRequest, withdrawRequest, cancelMyOrder } from '../actions';
import { DISCOUNT_TYPES } from '@/lib/program-data';
import ConfirmButton from '@/components/ConfirmButton';

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
  const { data: requests } = await supabase.from('machine_requests').select('*').order('id', { ascending: false });
  const open = (requests || []).find((r) => ['pending', 'approved'].includes(r.status));
  const lastRejected = !open && requests?.[0]?.status === 'rejected' && requests[0].kind === 'additional' ? requests[0] : null;
  const hours = (code) => DISCOUNT_TYPES.find((d) => d.code === code)?.hours;
  const unit = price?.unit_yen ?? 40000;
  const unpaid = (invoices || []).some((i) => i.status === 'published');
  const unpaidEquipment = (invoices || []).some((i) => i.kind === 'equipment' && i.status === 'published');
  // Machine orders not completely shipped yet (unpaid ones can be cancelled; paid ones are final).
  const openOrders = (invoices || []).filter(
    (i) =>
      i.kind === 'equipment' &&
      ['published', 'paid'].includes(i.status) &&
      (machines || []).some((m) => m.equipment_invoice_id === i.id && !m.shipped_on && !m.cancelled_at),
  );

  return (
    <section className="wrap section">
      <PortalHeader title={B.title} email={claims.email} links={portalLinks(O)} />
      <Notice sp={sp} o={O} extra={{ orderCancelled: B.orderCancelled, requested: B.requested, withdrawn: B.withdrawn }} />

      <div className="grid" style={{ alignItems: 'start' }}>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: 20 }}>{B.machineTitle}</h2>
          {open && (
            <div className="request-box">
              <h3 className="shipment-title">{open.status === 'approved' ? B.approvedTitle : B.pendingTitle}</h3>
              <p className="small">{open.status === 'approved' ? B.approvedText(T.yen(yen(unit))) : B.pendingText}</p>
              <ul className="request-items">
                {open.items.map((m, i) => (
                  <li key={i}>
                    {B.orderForm.machine.replace('{n}', i + 1)}：{m.discounts.map((c) => T.discount(hours(c))).join('・')}
                  </li>
                ))}
              </ul>
              <p className="order-total">
                {B.estimate}：<strong>{T.yen(yen(unit * open.items.length))}</strong>
                <span className="small muted">（{T.yen(yen(unit))} × {open.items.length}）</span>
              </p>
              {open.status === 'approved' && !unpaidEquipment && (
                <form action={orderRequest} className="form">
                  <input type="hidden" name="request" value={open.id} />
                  <label className="check">
                    <input type="checkbox" name="no_refund" required />
                    <span>{B.noRefund}</span>
                  </label>
                  <ConfirmButton className="btn btn-primary" message={B.orderApprovedConfirm}>
                    {B.orderApproved}
                  </ConfirmButton>
                </form>
              )}
              <form action={withdrawRequest} style={{ marginTop: 8 }}>
                <input type="hidden" name="request" value={open.id} />
                <ConfirmButton className="btn btn-line" message={B.withdrawConfirm}>
                  {B.withdraw}
                </ConfirmButton>
              </form>
            </div>
          )}
          {!open && ['approved', 'preparing', 'shipped', 'active'].includes(p.status) && !unpaidEquipment && (
            <>
              <h3 className="shipment-title">{B.requestTitle}</h3>
              {lastRejected && <p className="small warn">{B.lastRejected(lastRejected.note)}</p>}
              <p className="small">{B.requestText(T.yen(yen(unit)))}</p>
              <MachineOrderForm
                action={requestMachines}
                unitYen={unit}
                labels={{
                  ...B.orderForm,
                  choose: B.choose,
                  total: B.estimate,
                  discount: T.discount('{h}'),
                  yenFormat: T.yen('{n}'),
                  confirm: B.requestConfirm,
                  submit: B.requestSubmit,
                }}
              />
            </>
          )}
          {p.status === 'applied' && <p className="muted">{B.notYet}</p>}
          {['awaiting_payment', 'preparing', 'shipped'].includes(p.status) && (
            <p>
              <strong>{O.status[p.status]}</strong>：{O.onboarding.next[p.status]}
            </p>
          )}
          {openOrders.length > 0 && (
            <div className="open-orders">
              <h3 className="shipment-title">{B.openOrders}</h3>
              {openOrders.map((i) => {
                const ms = (machines || []).filter((m) => m.equipment_invoice_id === i.id);
                return (
                  <div key={i.id} className="open-order">
                    <p style={{ margin: 0 }}>
                      <Link href={`/portal/invoices/${i.id}`} className="num">
                        {i.invoice_no}
                      </Link>{' '}
                      · {B.machineCount(ms.length)} · {T.yen(yen(i.total_yen))} · {B.invStatus[i.status]}
                    </p>
                    {i.status === 'published' && (
                      <form action={cancelMyOrder}>
                        <p className="small muted" style={{ margin: '4px 0' }}>{B.unpaidHint}</p>
                        <input type="hidden" name="invoice" value={i.id} />
                        <ConfirmButton className="btn btn-line" message={B.cancelOrderConfirm}>
                          {B.cancelOrder}
                        </ConfirmButton>
                      </form>
                    )}
                    {i.status === 'paid' && <p className="small muted" style={{ margin: '4px 0 0' }}>{B.paidFinal}</p>}
                  </div>
                );
              })}
            </div>
          )}
          {(machines || [])
            .filter((m) => !m.cancelled_at)
            .map((m) => (
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
