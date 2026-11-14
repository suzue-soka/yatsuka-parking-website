import ValidatorCard from '@/components/ValidatorCard';
import { SITE } from '@/lib/site';
import { getContent } from '@/lib/content';

// The partner directory is filled from the partner system once each shop has
// agreed to be listed (Permission A). Until then no shop names are published.
export default function PartnersView({ lang = 'ja' }) {
  const c = getContent(lang);
  const p = c.partnersPage;
  const tel = lang === 'ja' ? SITE.tel : SITE.telIntl;
  return (
    <section className="wrap section">
      <div className="section-head">
        <p className="kicker">PARTNERS</p>
        <h1 style={{ margin: '4px 0 0', fontSize: 28 }}>{p.title}</h1>
      </div>
      <div className="card" style={{ marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ margin: 0 }}>
          <strong>{p.loginTitle}</strong>
          <br />
          <span className="small muted">{p.loginDesc}</span>
        </p>
        <a className="btn btn-primary" href="/login">
          {c.nav.login}
        </a>
      </div>
      <div className="card prose">
        <p style={{ marginTop: 0 }}>{p.intro}</p>
        <p className="muted" style={{ marginBottom: 0 }}>
          {p.pending}
        </p>
      </div>

      <div className="band" style={{ marginTop: 24 }}>
        <h2 style={{ marginTop: 0 }}>{p.bizTitle}</h2>
        <p>{p.bizText}</p>
        <div className="grid">
          {c.partnerBand.features.map((f) => (
            <div key={f.t}>
              <strong>{f.t}</strong>
              <p className="small" style={{ margin: 0 }}>
                {f.d}
              </p>
            </div>
          ))}
        </div>
        <ValidatorCard lang={lang} />
        <p style={{ marginBottom: 0 }}>
          {c.partnerBand.contact}
          {c.owner.name} <a href={SITE.telHref}>{tel}</a>
        </p>
      </div>
    </section>
  );
}
