import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/admin-guard';
import PortalHeader from '@/components/PortalHeader';
import Notice from '@/components/Notice';
import ConfirmButton from '@/components/ConfirmButton';
import { getAppLang } from '@/lib/app-lang';
import { appText } from '@/lib/content/app';
import { onbText } from '@/lib/content/onboarding';
import { programText } from '@/lib/content/program';
import { adminLinks } from '@/lib/admin-links';
import { DISCOUNT_TYPES } from '@/lib/program-data';
import { jstDateTime, jstToday, yen } from '@/lib/dates';
import { approveApplication, rejectApplication, resendInvite, confirmPayment, recordShipment, startService } from '../../actions';

export const dynamic = 'force-dynamic';
export async function generateMetadata() {
  return { title: onbText(await getAppLang()).admin.partners, robots: { index: false, follow: false } };
}

function Row({ label, children }) {
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>{children ?? '—'}</td>
    </tr>
  );
}

export default async function AdminPartner({ params, searchParams }) {
  const { supabase, claims } = await requireAdmin();
  const lang = await getAppLang();
  const T = appText(lang);
  const O = onbText(lang);
  const A = O.admin;
  const F = O.company.fields;
  const P = programText(lang);
  const { id } = await params;
  const sp = await searchParams;

  const { data: p } = await supabase.from('partners').select('*').eq('id', id).maybeSingle();
  if (!p) notFound();
  const [{ data: accounts }, { data: stores }, { data: machines }, { data: invoices }] = await Promise.all([
    supabase.from('profiles').select('id').eq('partner_id', id),
    supabase.from('store_numbers').select('store_no, discount_code, valid_from, valid_to, note').eq('partner_id', id).order('store_no'),
    supabase.from('machines').select('*').eq('partner_id', id).order('id'),
    supabase.from('invoices').select('id, invoice_no, kind, status, total_yen, issued_on, due_on, payments(amount_yen, paid_on, method)').eq('partner_id', id).order('created_at', { ascending: false }),
  ]);
  const hours = (code) => DISCOUNT_TYPES.find((d) => d.code === code)?.hours;
  const label = (code) => (hours(code) ? T.discount(hours(code)) : code);
  const unpaidEquipment = (invoices || []).find((i) => i.kind === 'equipment' && i.status === 'published');
  const B = O.billing;

  return (
    <section className="wrap section">
      <PortalHeader title={`${p.name}${p.partner_code ? `（${p.partner_code}）` : ''}`} email={claims.email} links={adminLinks(lang)} logout={T.logout} />
      <p className="small">
        <Link href="/admin/partners">{A.back}</Link>
      </p>
      <Notice sp={sp} o={O} extra={{ invited: A.invited, warnPrefix: A.approvedNoInvite }} />

      <div className="detail-layout">
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: 20 }}>{A.application}</h2>
          <table className="kv">
            <tbody>
              <Row label={F.status}>
                <span className="status-pill">{O.status[p.status] || p.status}</span>
              </Row>
              <Row label={F.partner_code}>{p.partner_code}</Row>
              <Row label={F.name}>{p.name}</Row>
              <Row label={F.category}>{P.categories[p.category] || p.category}</Row>
              <Row label={F.representative}>{p.representative}</Row>
              <Row label={F.contact_name}>{p.contact_name}</Row>
              <Row label={F.address}>{p.address}</Row>
              <Row label={F.phone}>{p.phone}</Row>
              <Row label={F.email}>{p.email}</Row>
              <Row label={F.website}>
                {p.website && (
                  <a href={p.website} target="_blank" rel="noopener noreferrer">
                    {p.website}
                  </a>
                )}
              </Row>
              <Row label={A.usage}>{P.usage[p.expected_usage] || p.expected_usage}</Row>
              <Row label={A.discounts}>{(p.requested_discounts || []).map(label).join(' / ') || null}</Row>
              <Row label={P.f.docKind}>
                {p.doc_path ? (
                  <a href={`/admin/partners/${p.id}/document`} target="_blank" rel="noopener">
                    {P.docKinds[p.doc_kind] || ''} — {A.document}
                  </a>
                ) : (
                  A.noDocument
                )}
              </Row>
              <Row label={A.consents}>
                {p.terms_agreed_at ? (
                  <>
                    {A.consentTerms} ✓ {A.consentPrivacy} ✓ {A.consentAntisocial} ✓
                  </>
                ) : null}
              </Row>
              <Row label="A / B">
                {p.permission_a ? 'A ✓' : 'A —'} {p.permission_b ? 'B ✓' : 'B —'}
              </Row>
              <Row label={A.applied}>{jstDateTime(p.created_at)}</Row>
              <Row label={A.lang}>{p.applied_lang}</Row>
              <Row label={A.account}>{(accounts || []).length ? `${accounts.length}` : A.noAccount}</Row>
              {p.review_note && <Row label={A.rejectNote}>{p.review_note}</Row>}
            </tbody>
          </table>
        </div>

        <div>
          {p.status === 'applied' && (
            <div className="card">
              <form action={approveApplication} className="form">
                <input type="hidden" name="id" value={p.id} />
                <ConfirmButton className="btn btn-primary" message={A.approveConfirm}>
                  {A.approve}
                </ConfirmButton>
              </form>
              <form action={rejectApplication} className="form" style={{ marginTop: 16 }}>
                <input type="hidden" name="id" value={p.id} />
                <label htmlFor="note">{A.rejectNote}</label>
                <textarea id="note" name="note" maxLength={1000} style={{ minHeight: 80 }} />
                <button className="btn btn-line" type="submit">
                  {A.reject}
                </button>
              </form>
            </div>
          )}

          {p.partner_code && p.email && !['active', 'rejected', 'terminated'].includes(p.status) && (
            <div className="card" style={{ marginBottom: 16 }}>
              <form action={resendInvite} className="form">
                <input type="hidden" name="id" value={p.id} />
                <p className="small muted" style={{ margin: 0 }}>
                  {A.account}: {(accounts || []).length ? '✓' : A.noAccount} · {p.email}
                </p>
                <button className="btn btn-line" type="submit">
                  {A.invite}
                </button>
              </form>
            </div>
          )}

          {p.status === 'awaiting_payment' && unpaidEquipment && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h2 style={{ marginTop: 0, fontSize: 20 }}>{A.payTitle}</h2>
              <p className="small">
                {unpaidEquipment.invoice_no} · {T.yen(yen(unpaidEquipment.total_yen))}
              </p>
              <form action={confirmPayment} className="form">
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="invoice" value={unpaidEquipment.id} />
                <label htmlFor="paid_on">{A.paidOn}</label>
                <input id="paid_on" name="paid_on" type="date" required defaultValue={jstToday()} />
                <label htmlFor="amount">{A.amount}</label>
                <input id="amount" name="amount" type="number" min="1" required defaultValue={unpaidEquipment.total_yen} />
                <label htmlFor="pnote">{A.note}</label>
                <input id="pnote" name="note" type="text" maxLength={500} />
                <button className="btn btn-primary" type="submit">
                  {A.confirmPay}
                </button>
              </form>
            </div>
          )}

          {p.status === 'preparing' && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h2 style={{ marginTop: 0, fontSize: 20 }}>{A.shipTitle}</h2>
              <form action={recordShipment} className="form">
                <input type="hidden" name="id" value={p.id} />
                <label htmlFor="serial">{A.serial}</label>
                <input id="serial" name="serial" type="text" maxLength={100} />
                <label htmlFor="carrier">{A.carrier}</label>
                <input id="carrier" name="carrier" type="text" maxLength={100} />
                <label htmlFor="tracking">{A.tracking}</label>
                <input id="tracking" name="tracking" type="text" maxLength={100} />
                <label htmlFor="shipped_on">{A.shippedOn}</label>
                <input id="shipped_on" name="shipped_on" type="date" required defaultValue={jstToday()} />
                <button className="btn btn-primary" type="submit">
                  {A.ship}
                </button>
              </form>
            </div>
          )}

          {p.status === 'shipped' && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h2 style={{ marginTop: 0, fontSize: 20 }}>{A.startTitle}</h2>
              <form action={startService} className="form">
                <input type="hidden" name="id" value={p.id} />
                <label htmlFor="from">{A.startFrom}</label>
                <input id="from" name="from" type="date" required defaultValue={jstToday()} />
                {[0, 1].map((i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
                    <div className="form">
                      <label htmlFor={`store_no_${i}`}>
                        {A.storeNo} {i + 1}
                      </label>
                      <input id={`store_no_${i}`} name={`store_no_${i}`} type="number" min="1" required={i === 0} />
                    </div>
                    <div className="form">
                      <label htmlFor={`discount_${i}`}>{A.discount}</label>
                      <select id={`discount_${i}`} name={`discount_${i}`} defaultValue={(p.requested_discounts || [])[i] || ''}>
                        <option value="">—</option>
                        {DISCOUNT_TYPES.map((d) => (
                          <option key={d.code} value={d.code}>
                            {T.discount(d.hours)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                <button className="btn btn-primary" type="submit">
                  {A.start}
                </button>
              </form>
            </div>
          )}

          {(stores || []).length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h2 style={{ marginTop: 0, fontSize: 20 }}>{A.stores}</h2>
              <ul className="small" style={{ paddingLeft: 20, margin: 0 }}>
                {stores.map((s) => (
                  <li key={`${s.store_no}-${s.valid_from}`}>
                    {O.terms.store(s.store_no)}：{label(s.discount_code)}（{s.valid_from}〜{s.valid_to || ''}）{s.note ? ` ${s.note}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(machines || []).length > 0 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h2 style={{ marginTop: 0, fontSize: 20 }}>{A.machines}</h2>
              <ul className="small" style={{ paddingLeft: 20, margin: 0 }}>
                {machines.map((m) => (
                  <li key={m.id}>
                    {m.model} · {B.machine.serial} {m.serial_no || '—'} · {B.machine.shipped} {m.shipped_on || '—'} · {m.carrier || ''} {m.tracking_no || ''}
                    {m.warranty_until ? ` · ${B.machine.warranty} ${m.warranty_until}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(invoices || []).length > 0 && (
            <div className="card table-wrap">
              <h2 style={{ marginTop: 0, fontSize: 20 }}>{A.invoices}</h2>
              <table>
                <tbody>
                  {invoices.map((i) => (
                    <tr key={i.id}>
                      <td className="num">
                        <Link href={`/portal/invoices/${i.id}`}>{i.invoice_no}</Link>
                      </td>
                      <td>{B.kinds[i.kind]}</td>
                      <td className="right num">{T.yen(yen(i.total_yen))}</td>
                      <td>{B.invStatus[i.status]}</td>
                      <td className="small">
                        {(i.payments || []).map((x) => `${x.paid_on} ${T.yen(yen(x.amount_yen))}`).join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
