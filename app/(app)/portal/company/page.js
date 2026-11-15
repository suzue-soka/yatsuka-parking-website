import SubmitButton from '@/components/SubmitButton';
import PortalHeader from '@/components/PortalHeader';
import Notice from '@/components/Notice';
import { getAppLang } from '@/lib/app-lang';
import { onbText } from '@/lib/content/onboarding';
import { programText } from '@/lib/content/program';
import { requirePartner, portalLinks } from '@/lib/portal-guard';
import { jstDateTime } from '@/lib/dates';
import { saveContact, requestChange } from '../actions';

export const dynamic = 'force-dynamic';
export async function generateMetadata() {
  return { title: onbText(await getAppLang()).company.title, robots: { index: false, follow: false } };
}

export default async function Company({ searchParams }) {
  const { supabase, claims, partner: p, lang, T, O } = await requirePartner('/portal/company');
  if (!p) return <p className="wrap section">{T.portal.noPartner}</p>;
  const C = O.company;
  const F = C.fields;
  const P = programText(lang);
  const sp = await searchParams;
  const { data: history } = await supabase.from('change_requests').select('id, changes, status, review_note, created_at').order('created_at', { ascending: false }).limit(20);
  const billingFields = ['name', 'name_kana', 'representative', 'address', 'billing_name', 'billing_address'];

  return (
    <section className="wrap section">
      <PortalHeader title={C.title} email={claims.email} links={portalLinks(O)} />
      <Notice sp={sp} o={O} extra={{ sent: O.sent }} />
      <div className="grid" style={{ alignItems: 'start' }}>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: 20 }}>{C.contactTitle}</h2>
          <p className="small muted">
            {F.partner_code}: <strong className="num">{p.partner_code}</strong> · {F.category}: {P.categories[p.category] || p.category || '—'} · {F.status}:{' '}
            {O.status[p.status]}
          </p>
          <form action={saveContact} className="form">
            {['contact_name', 'phone', 'email', 'website', 'hours', 'holidays'].map((k) => (
              <div key={k} className="form">
                <label htmlFor={k}>{F[k]}</label>
                <input
                  id={k}
                  name={k}
                  type={k === 'email' ? 'email' : k === 'phone' ? 'tel' : k === 'website' ? 'url' : 'text'}
                  defaultValue={p[k] || ''}
                  maxLength={300}
                  required={['contact_name', 'phone', 'email'].includes(k)}
                />
              </div>
            ))}
            <label className="check">
              <input type="checkbox" name="permission_a" defaultChecked={p.permission_a} />
              <span>{C.permissionA}</span>
            </label>
            <label className="check">
              <input type="checkbox" name="permission_b" defaultChecked={p.permission_b} />
              <span>{C.permissionB}</span>
            </label>
            <p className="small muted">{C.contactNote}</p>
            <SubmitButton className="btn btn-primary">
              {C.save}
            </SubmitButton>
          </form>
        </div>

        <div>
          <div className="card">
            <h2 style={{ marginTop: 0, fontSize: 20 }}>{C.billingTitle}</h2>
            <p className="small muted">{C.billingNote}</p>
            <form action={requestChange} className="form">
              {billingFields.map((k) => (
                <div key={k} className="form">
                  <label htmlFor={k}>
                    {F[k]} <span className="small muted">（{p[k] || '—'}）</span>
                  </label>
                  <input id={k} name={k} type="text" maxLength={300} />
                </div>
              ))}
              <SubmitButton className="btn btn-line">
                {C.request}
              </SubmitButton>
            </form>
          </div>
          <div className="card" style={{ marginTop: 16 }}>
            <h2 style={{ marginTop: 0, fontSize: 18 }}>{C.history}</h2>
            {(history || []).length === 0 ? (
              <p className="small muted">{C.none}</p>
            ) : (
              <ul className="small" style={{ paddingLeft: 20 }}>
                {history.map((h) => (
                  <li key={h.id}>
                    {jstDateTime(h.created_at)} · {C.reqStatus[h.status]} ·{' '}
                    {Object.entries(h.changes)
                      .map(([k, v]) => `${F[k] || k}: ${v}`)
                      .join(' / ')}
                    {h.review_note ? ` · ${h.review_note}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
