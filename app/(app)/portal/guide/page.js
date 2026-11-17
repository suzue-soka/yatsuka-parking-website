import SubmitButton from '@/components/SubmitButton';
import PortalHeader from '@/components/PortalHeader';
import Notice from '@/components/Notice';
import { getAppLang } from '@/lib/app-lang';
import { guideText } from '@/lib/content/guide';
import { requirePartner, portalLinks } from '@/lib/portal-guard';
import { jstToday } from '@/lib/dates';
import { reportMachineService } from '../actions';

export const dynamic = 'force-dynamic';
export async function generateMetadata() {
  return { title: guideText(await getAppLang()).title, robots: { index: false, follow: false } };
}

// ご利用ガイド (約款 第3条) and the repair / replacement report (約款 第16条).
export default async function Guide({ searchParams }) {
  const { supabase, claims, partner: p, lang, T, O } = await requirePartner('/portal/guide');
  if (!p) return <p className="wrap section">{T.portal.noPartner}</p>;
  const G = guideText(lang);
  const R = G.report;
  const sp = await searchParams;
  const [{ data: machines }, { data: reports }] = await Promise.all([
    supabase.from('machines').select('id, machine_code, serial_no, shipped_on, cancelled_at').not('shipped_on', 'is', null).is('cancelled_at', null).order('machine_no'),
    supabase.from('machine_reports').select('*, machines(machine_code)').order('created_at', { ascending: false }).limit(50),
  ]);
  const list = machines || [];

  return (
    <section className="wrap section">
      <PortalHeader title={G.title} email={claims.email} links={portalLinks(O)} />
      <Notice sp={sp} o={O} extra={{ reported: R.sent }} />
      <div className="grid" style={{ alignItems: 'start' }}>
        <div className="card">
          <p className="small" style={{ marginTop: 0 }}>{G.intro}</p>
          {G.sections.map((s) => {
            const List = s.ordered ? 'ol' : 'ul';
            return (
              <div key={s.h}>
                <h2 style={{ fontSize: 20 }}>{s.h}</h2>
                <List>
                  {s.items.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </List>
              </div>
            );
          })}
          <p className="small">{G.contact}</p>
        </div>
        <div className="card" id="report">
          <h2 style={{ marginTop: 0, fontSize: 20 }}>{R.title}</h2>
          <p className="small">{R.text}</p>
          {list.length === 0 ? (
            <p className="small muted">{R.noMachines}</p>
          ) : (
            <form action={reportMachineService} className="form">
              <label htmlFor="machine">{R.machine}</label>
              <select id="machine" name="machine" required defaultValue={list.length === 1 ? list[0].id : ''}>
                {list.length > 1 && <option value="" />}
                {list.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.machine_code}
                    {m.serial_no ? `（${m.serial_no}）` : ''}
                  </option>
                ))}
              </select>
              <label htmlFor="kind">{R.kind}</label>
              <select id="kind" name="kind" required defaultValue="repair">
                <option value="repair">{R.kinds.repair}</option>
                <option value="replacement">{R.kinds.replacement}</option>
              </select>
              <label htmlFor="on">{R.date}</label>
              <input id="on" name="on" type="date" required max={jstToday()} />
              <label htmlFor="new_serial">{R.newSerial}</label>
              <input id="new_serial" name="new_serial" type="text" maxLength={60} />
              <label htmlFor="note">{R.note}</label>
              <textarea id="note" name="note" maxLength={2000} style={{ minHeight: 80 }} />
              <SubmitButton className="btn btn-primary">{R.send}</SubmitButton>
            </form>
          )}
          <h3 style={{ fontSize: 16, marginTop: 24 }}>{R.list}</h3>
          {(reports || []).length === 0 && <p className="small muted">{R.none}</p>}
          {(reports || []).map((r) => (
            <div key={r.id} style={{ borderTop: '1px solid var(--line)', padding: '10px 0' }}>
              <p className="small muted" style={{ margin: 0 }}>
                {r.happened_on} · <span className={r.status === 'confirmed' ? 'ok' : 'warn'}>{R.st[r.status]}</span>
              </p>
              <strong>
                {r.machines?.machine_code} · {R.kinds[r.kind]}
              </strong>
              {r.new_serial && (
                <p className="small" style={{ margin: '4px 0 0' }}>
                  {R.serial}：{r.new_serial}
                </p>
              )}
              {r.note && (
                <p className="small" style={{ whiteSpace: 'pre-wrap', margin: '4px 0 0' }}>
                  {r.note}
                </p>
              )}
              {r.admin_note && (
                <p className="small" style={{ whiteSpace: 'pre-wrap', margin: '4px 0 0' }}>
                  <strong>{R.reply}</strong>
                  {r.admin_note}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
