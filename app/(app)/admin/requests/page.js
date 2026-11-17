import SubmitButton from '@/components/SubmitButton';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-guard';
import PortalHeader from '@/components/PortalHeader';
import Notice from '@/components/Notice';
import { getAppLang } from '@/lib/app-lang';
import { appText } from '@/lib/content/app';
import { onbText } from '@/lib/content/onboarding';
import { adminLinks } from '@/lib/admin-links';
import { jstDateTime } from '@/lib/dates';
import { closeInquiry, reviewChange, confirmMachineReport } from '../actions';
import { guideText } from '@/lib/content/guide';
import ConfirmButton from '@/components/ConfirmButton';

export const dynamic = 'force-dynamic';
export async function generateMetadata() {
  return { title: onbText(await getAppLang()).admin.requests, robots: { index: false, follow: false } };
}

export default async function AdminRequests({ searchParams }) {
  const { supabase, claims } = await requireAdmin();
  const lang = await getAppLang();
  const T = appText(lang);
  const O = onbText(lang);
  const A = O.admin;
  const F = O.company.fields;
  const G = guideText(lang);
  const sp = await searchParams;

  const [{ data: inquiries }, { data: changes }, { data: reports }] = await Promise.all([
    supabase.from('inquiries').select('id, subject, body, created_at, partners(id, partner_code, name)').eq('status', 'open').order('created_at'),
    supabase
      .from('change_requests')
      .select('id, changes, created_at, partners(id, partner_code, name, name_kana, representative, address, billing_name, billing_address)')
      .eq('status', 'pending')
      .order('created_at'),
    supabase
      .from('machine_reports')
      .select('id, kind, happened_on, new_serial, note, created_at, machines(machine_code, serial_no), partners(id, partner_code, name)')
      .eq('status', 'open')
      .order('created_at'),
  ]);

  return (
    <section className="wrap section">
      <PortalHeader title={A.requests} email={claims.email} links={adminLinks(lang)} />
      <Notice sp={sp} o={O} />

      <h2 style={{ fontSize: 20 }}>{A.inquiries}</h2>
      {(inquiries || []).length === 0 && <p className="muted">{A.noneOpen}</p>}
      {(inquiries || []).map((q) => (
        <div key={q.id} className="card" style={{ marginBottom: 12 }}>
          <p className="small muted" style={{ margin: 0 }}>
            {jstDateTime(q.created_at)} · <Link href={`/admin/partners/${q.partners?.id}`}>{q.partners?.partner_code} {q.partners?.name}</Link>
          </p>
          <h3 style={{ margin: '4px 0' }}>{q.subject}</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{q.body}</p>
          <form action={closeInquiry} className="form">
            <input type="hidden" name="inquiry" value={q.id} />
            <label htmlFor={`a${q.id}`}>{A.answer}</label>
            <textarea id={`a${q.id}`} name="answer" maxLength={5000} style={{ minHeight: 80 }} />
            <SubmitButton className="btn btn-primary">
              {A.close}
            </SubmitButton>
          </form>
        </div>
      ))}

      <h2 style={{ fontSize: 20, marginTop: 32 }}>{A.changes}</h2>
      {(changes || []).length === 0 && <p className="muted">{A.noneOpen}</p>}
      {(changes || []).map((r) => (
        <div key={r.id} className="card" style={{ marginBottom: 12 }}>
          <p className="small muted" style={{ margin: 0 }}>
            {jstDateTime(r.created_at)} · <Link href={`/admin/partners/${r.partners?.id}`}>{r.partners?.partner_code} {r.partners?.name}</Link>
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col" />
                  <th scope="col">{A.current}</th>
                  <th scope="col">{A.requested}</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(r.changes || {}).map(([k, v]) => (
                  <tr key={k}>
                    <th scope="row">{F[k] || k}</th>
                    <td style={{ whiteSpace: 'normal' }}>{r.partners?.[k] || '—'}</td>
                    <td style={{ whiteSpace: 'normal' }}>
                      <strong>{String(v)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <form action={reviewChange} className="form">
            <input type="hidden" name="request" value={r.id} />
            <label htmlFor={`n${r.id}`}>{A.note}</label>
            <input id={`n${r.id}`} name="note" type="text" maxLength={1000} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <SubmitButton className="btn btn-primary" name="decision" value="approve">
                {A.approveChange}
              </SubmitButton>
              <SubmitButton className="btn btn-line" name="decision" value="reject">
                {A.rejectChange}
              </SubmitButton>
            </div>
          </form>
        </div>
      ))}

      <h2 style={{ fontSize: 20, marginTop: 32 }}>{G.admin.title}</h2>
      {(reports || []).length === 0 ? <p className="muted">{A.noneOpen}</p> : <p className="small muted">{G.admin.hint}</p>}
      {(reports || []).map((r) => (
        <div key={r.id} className="card" style={{ marginBottom: 12 }}>
          <p className="small muted" style={{ margin: 0 }}>
            {jstDateTime(r.created_at)} · <Link href={`/admin/partners/${r.partners?.id}`}>{r.partners?.partner_code} {r.partners?.name}</Link>
          </p>
          <h3 style={{ margin: '4px 0' }}>
            {r.machines?.machine_code} · {G.report.kinds[r.kind]} · {r.happened_on}
          </h3>
          <p className="small" style={{ margin: 0 }}>
            {O.billing.machine.serial}：{r.machines?.serial_no || '—'}
            {r.new_serial ? ` → ${G.report.serial}：${r.new_serial}` : ''}
          </p>
          {r.note && <p style={{ whiteSpace: 'pre-wrap' }}>{r.note}</p>}
          <form action={confirmMachineReport} className="form">
            <input type="hidden" name="report" value={r.id} />
            <label htmlFor={`r${r.id}`}>{G.admin.note}</label>
            <input id={`r${r.id}`} name="note" type="text" maxLength={2000} />
            <ConfirmButton className="btn btn-primary" message={G.admin.confirmMsg}>
              {G.admin.confirm}
            </ConfirmButton>
          </form>
        </div>
      ))}
    </section>
  );
}
