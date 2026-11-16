import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-guard';
import PortalHeader from '@/components/PortalHeader';
import Notice from '@/components/Notice';
import ConfirmButton from '@/components/ConfirmButton';
import SubmitButton from '@/components/SubmitButton';
import SortableTable from '@/components/SortableTable';
import { getAppLang } from '@/lib/app-lang';
import { appText } from '@/lib/content/app';
import { onbText } from '@/lib/content/onboarding';
import { billingText } from '@/lib/content/billing';
import { adminLinks } from '@/lib/admin-links';
import { jstToday, yen } from '@/lib/dates';
import { dueDate, addMonths } from '@/lib/holidays';
import { billingMonth } from '@/lib/billing';
import AutoPublishToggle from './AutoPublishToggle';
import ScrollToHash from '@/components/ScrollToHash';
import { saveAutoPublish, createDraftsNow, publishDrafts, redoDrafts, confirmPaymentInline } from './actions';

export const dynamic = 'force-dynamic';
export async function generateMetadata() {
  return { title: billingText(await getAppLang()).title, robots: { index: false, follow: false } };
}

export default async function AdminBilling({ searchParams }) {
  const { supabase, claims } = await requireAdmin();
  const lang = await getAppLang();
  const T = appText(lang);
  const O = onbText(lang);
  const t = billingText(lang);
  const sp = await searchParams;
  const today = jstToday();
  const n = sp?.n || '0';
  const A = O.admin;
  const unpaidOnly = sp?.unpaid === '1';

  const [{ data: settings }, { data: drafts }, { data: recent }, { data: runs }] = await Promise.all([
    supabase.from('billing_settings').select('auto_publish').eq('id', 1).maybeSingle(),
    supabase
      .from('invoices')
      .select('id, period_month, validation_count, gross_yen, volume_rate, total_yen, partner_id, partners(partner_code, name)')
      .eq('kind', 'monthly')
      .eq('status', 'draft'),
    supabase
      .from('invoices')
      .select('id, invoice_no, period_month, total_yen, issued_on, due_on, status, partners(partner_code, name)')
      .eq('kind', 'monthly')
      .in('status', unpaidOnly ? ['published'] : ['published', 'paid', 'cancelled'])
      .order('issued_on', { ascending: false })
      .limit(200),
    supabase.from('billing_runs').select('month'),
  ]);
  const due = dueDate(today);
  const months = [...new Set((drafts || []).map((d) => d.period_month))].sort();
  const target = billingMonth(today);
  const canCreate = !(runs || []).some((r) => r.month === target) && !months.includes(target);

  // Per month: checks and last month's amounts for comparison.
  const sections = await Promise.all(
    months.map(async (m) => {
      const prev = addMonths(m, -1);
      const [{ data: checks }, { data: prevInv }] = await Promise.all([
        supabase.rpc('billing_checks', { p_month: m }),
        supabase.from('invoices').select('partner_id, total_yen').eq('kind', 'monthly').eq('period_month', prev).neq('status', 'cancelled'),
      ]);
      const prevBy = Object.fromEntries((prevInv || []).map((i) => [i.partner_id, i.total_yen]));
      const rows = (drafts || [])
        .filter((d) => d.period_month === m)
        .sort((a, b) => String(a.partners?.partner_code).localeCompare(String(b.partners?.partner_code), 'ja', { numeric: true }));
      return { m, rows, prevBy, checks: checks?.[0] || { missing_days: [], unknown_stores: [] } };
    }),
  );
  const big = (now, before) => before != null && before >= 1000 && Math.abs(now - before) / before >= 0.5;
  const md = (d) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;

  return (
    <section className="wrap section">
      <PortalHeader title={t.title} email={claims.email} links={adminLinks(lang)} />
      <Notice
        sp={sp}
        o={O}
        extra={{
          autoSaved: t.autoSaved,
          created: t.created(n),
          createdNone: t.createdNone,
          published: t.published(n),
          redone: t.redone(n),
          mail: t.publishedMailErr(n, ''),
        }}
      />
      <p className="small muted">{t.rule}</p>

      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: 20 }}>{t.autoTitle}</h2>
        <AutoPublishToggle action={saveAutoPublish} on={!!settings?.auto_publish} label={t.auto} />
        <p className="small muted" style={{ marginBottom: 0 }}>
          {t.autoHint}
        </p>
      </div>

      {sections.length === 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p style={{ marginTop: 0 }}>{t.noDrafts}</p>
          {canCreate && (
            <form action={createDraftsNow} className="form" style={{ marginBottom: 0 }}>
              <input type="hidden" name="month" value={target} />
              <p className="small muted" style={{ margin: 0 }}>
                {t.createHint}
              </p>
              <SubmitButton className="btn btn-line">{t.createNow(target)}</SubmitButton>
            </form>
          )}
        </div>
      )}

      {sections.map(({ m, rows, prevBy, checks }) => (
        <div key={m} className="card" style={{ marginBottom: 16, borderColor: 'var(--orange)' }}>
          <h2 style={{ marginTop: 0, fontSize: 20 }}>{t.draftsTitle(m, rows.length)}</h2>
          {checks.missing_days?.length > 0 && <p className="small warn">{t.missingDays(checks.missing_days.map(md).join('、'))}</p>}
          {checks.unknown_stores?.length > 0 && <p className="small warn">{t.unknownStores(checks.unknown_stores.join('、'))}</p>}
          {!checks.missing_days?.length && !checks.unknown_stores?.length && <p className="small ok">{t.checksOk}</p>}
          <form action={publishDrafts}>
            <input type="hidden" name="month" value={m} />
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {t.th.map((h, i) => (
                      <th key={h} scope="col" className={i >= 3 && i <= 7 ? 'right' : undefined}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const before = prevBy[r.partner_id];
                    return (
                      <tr key={r.id}>
                        <td>
                          <input type="checkbox" name="ids" value={r.id} defaultChecked aria-label={r.partners?.name} />
                        </td>
                        <td className="num">{r.partners?.partner_code}</td>
                        <td>{r.partners?.name}</td>
                        <td className="right num">{r.validation_count}</td>
                        <td className="right num">{T.yen(yen(r.gross_yen))}</td>
                        <td className="right num">{Math.round(Number(r.volume_rate) * 100)}%</td>
                        <td className="right num">
                          <strong>{T.yen(yen(r.total_yen))}</strong>
                        </td>
                        <td className="right num">{before != null ? T.yen(yen(before)) : '—'}</td>
                        <td>
                          <Link href={`/portal/invoices/${r.id}`} target="_blank">
                            {t.preview}
                          </Link>
                          {big(r.total_yen, before) && <div className="small warn">{t.bigChange}</div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="small">{t.issueDue(today, due)}</p>
            <p className="small muted">{t.publishHint}</p>
            <ConfirmButton className="btn btn-primary" message={t.publishConfirm}>
              {t.publish}
            </ConfirmButton>
          </form>
          <form action={redoDrafts} style={{ marginTop: 10 }}>
            <input type="hidden" name="month" value={m} />
            <ConfirmButton className="btn btn-line" message={t.redoConfirm}>
              {t.redo}
            </ConfirmButton>
          </form>
        </div>
      ))}

      <ScrollToHash token={`${sp?.paid || ''}${sp?.perr || ''}${sp?.unpaid || ''}`} />
      <div id="issued" className="card table-wrap" style={{ scrollMarginTop: 90 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ marginTop: 0, fontSize: 20 }}>{t.recentTitle}</h2>
          <Link className="chip" href={unpaidOnly ? '/admin/billing#issued' : '/admin/billing?unpaid=1#issued'}>
            {unpaidOnly ? t.showAll : t.unpaidOnly}
          </Link>
        </div>
        {sp?.paid && <p className="ok small" style={{ marginTop: 0 }}>{t.paidDone(sp.paid)}</p>}
        {sp?.perr && <p className="alert small" style={{ marginTop: 0 }}>{sp.perr}</p>}
        {(recent || []).length === 0 ? (
          <p className="small muted">{t.noRecent}</p>
        ) : (
          <SortableTable initial={0}>
            <table>
              <thead>
                <tr>
                  {t.recentTh.map((h, i) => (
                    <th key={h} scope="col" className={i === 3 ? 'right' : undefined}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((i) => (
                  <tr key={i.id}>
                    <td className="num">
                      <Link href={`/portal/invoices/${i.id}`}>{i.invoice_no}</Link>
                    </td>
                    <td>
                      {i.partners?.partner_code} {i.partners?.name}
                    </td>
                    <td className="num">{i.period_month?.slice(0, 7)}</td>
                    <td className="right num">{T.yen(yen(i.total_yen))}</td>
                    <td className="num">{i.issued_on}</td>
                    <td className="num">{i.due_on}</td>
                    <td className={i.status === 'paid' ? 'ok' : i.status === 'published' ? 'warn' : undefined}>
                      {i.status === 'published' ? (
                        // Unpaid: click to confirm the bank transfer right here (date and amount prefilled).
                        <details className="pay-inline">
                          <summary>{O.billing.invStatus[i.status]}</summary>
                          <form action={confirmPaymentInline} className="pay-inline-form">
                            <input type="hidden" name="invoice" value={i.id} />
                            <input type="hidden" name="unpaid" value={unpaidOnly ? '1' : ''} />
                            <label>
                              {A.paidOn}
                              <input name="paid_on" type="date" required defaultValue={today} />
                            </label>
                            <label>
                              {A.amount}
                              <input name="amount" type="number" min="1" required defaultValue={i.total_yen} />
                            </label>
                            <SubmitButton className="btn btn-primary">{A.confirmPay}</SubmitButton>
                          </form>
                        </details>
                      ) : (
                        O.billing.invStatus[i.status]
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SortableTable>
        )}
      </div>

    </section>
  );
}
