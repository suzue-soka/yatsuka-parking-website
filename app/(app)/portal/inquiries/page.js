import SubmitButton from '@/components/SubmitButton';
import PortalHeader from '@/components/PortalHeader';
import Notice from '@/components/Notice';
import { getAppLang } from '@/lib/app-lang';
import { onbText } from '@/lib/content/onboarding';
import { requirePartner, portalLinks } from '@/lib/portal-guard';
import { jstDateTime } from '@/lib/dates';
import { sendInquiry } from '../actions';

export const dynamic = 'force-dynamic';
export async function generateMetadata() {
  return { title: onbText(await getAppLang()).inquiries.title, robots: { index: false, follow: false } };
}

export default async function Inquiries({ searchParams }) {
  const { supabase, claims, partner: p, T, O } = await requirePartner('/portal/inquiries');
  if (!p) return <p className="wrap section">{T.portal.noPartner}</p>;
  const Q = O.inquiries;
  const sp = await searchParams;
  const { data: list } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false }).limit(50);

  return (
    <section className="wrap section">
      <PortalHeader title={Q.title} email={claims.email} logout={T.logout} links={portalLinks(O)} />
      <Notice sp={sp} o={O} extra={{ sent: O.sent }} />
      <div className="grid" style={{ alignItems: 'start' }}>
        <div className="card">
          <form action={sendInquiry} className="form">
            <label htmlFor="subject">{Q.subject}</label>
            <input id="subject" name="subject" type="text" required maxLength={200} />
            <label htmlFor="body">{Q.body}</label>
            <textarea id="body" name="body" required maxLength={5000} />
            <SubmitButton className="btn btn-primary">
              {Q.send}
            </SubmitButton>
          </form>
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: 20 }}>{Q.list}</h2>
          {(list || []).length === 0 && <p className="small muted">{Q.none}</p>}
          {(list || []).map((q) => (
            <div key={q.id} style={{ borderTop: '1px solid var(--line)', padding: '10px 0' }}>
              <p className="small muted" style={{ margin: 0 }}>
                {jstDateTime(q.created_at)} · <span className={q.status === 'closed' ? 'ok' : 'warn'}>{Q.st[q.status]}</span>
              </p>
              <strong>{q.subject}</strong>
              <p className="small" style={{ whiteSpace: 'pre-wrap', margin: '4px 0' }}>
                {q.body}
              </p>
              {q.admin_note && (
                <p className="small" style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                  <strong>{Q.reply}</strong>
                  {q.admin_note}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
