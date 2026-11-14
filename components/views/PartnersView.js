import ValidatorCard from '@/components/ValidatorCard';
import ApplyForm from '@/components/ApplyForm';
import { SITE } from '@/lib/site';
import { getContent } from '@/lib/content';
import { programText } from '@/lib/content/program';
import { DISCOUNT_TYPES, VOLUME_TIERS } from '@/lib/program-data';
import { href } from '@/lib/i18n';

const yenNum = (n) => n.toLocaleString('ja-JP');

// The partner directory is filled from the partner system once each shop has
// agreed to be listed (Permission A). Until then no shop names are published.
export default function PartnersView({ lang = 'ja' }) {
  const c = getContent(lang);
  const p = c.partnersPage;
  const t = programText(lang);
  const tel = lang === 'ja' ? SITE.tel : SITE.telIntl;
  const loginHref = lang === 'ja' ? '/login' : `/login?lang=${lang}`;
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
        <a className="btn btn-primary" href={loginHref}>
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
        <p className="kicker" style={{ color: 'inherit', opacity: 0.8 }}>
          {t.kicker}
        </p>
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
        <p style={{ marginBottom: 0 }}>
          <a className="btn btn-primary" href="#apply">
            {t.applyCta}
          </a>
        </p>
      </div>

      <h2 id="how" style={{ marginTop: 40 }}>
        {t.howTitle}
      </h2>
      <ol className="steps">
        {t.how.map((s) => (
          <li key={s.t}>
            <strong style={{ display: 'block' }}>{s.t}</strong>
            <span className="small">{s.d}</span>
          </li>
        ))}
      </ol>

      <div className="grid" style={{ marginTop: 32, alignItems: 'start' }}>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: 20 }}>{t.discountsTitle}</h2>
          <p className="small muted">{t.discountsNote}</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">{t.thDiscount[0]}</th>
                  <th scope="col" className="right">
                    {t.thDiscount[1]}
                  </th>
                </tr>
              </thead>
              <tbody>
                {DISCOUNT_TYPES.map((d) => (
                  <tr key={d.code}>
                    <td>{t.discountLabel(d.hours)}</td>
                    <td className="right num">{c.yen(yenNum(d.yen))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: 20 }}>{t.volumeTitle}</h2>
          <p className="small muted">{t.volumeNote}</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">{t.thVolume[0]}</th>
                  <th scope="col" className="right">
                    {t.thVolume[1]}
                  </th>
                  <th scope="col" className="right">
                    {t.thVolume[2]}
                  </th>
                </tr>
              </thead>
              <tbody>
                {VOLUME_TIERS.map((v) => (
                  <tr key={v.min}>
                    <td className="num">{t.range(v.min, v.max)}</td>
                    <td className="right num">{v.rate}%</td>
                    <td className="right num">{t.pays(100 - v.rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small">{t.example}</p>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <ValidatorCard lang={lang} />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: 20 }}>{t.conditionsTitle}</h2>
        <ul>
          {t.conditions.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <p className="small" style={{ marginBottom: 0 }}>
          <a href={href(lang, '/partners/terms')}>{t.termsLink}</a>
        </p>
      </div>

      <div id="apply" style={{ marginTop: 40, scrollMarginTop: 80 }}>
        <h2>{t.applyTitle}</h2>
        <p>{t.applyIntro}</p>
        <ApplyForm lang={lang} />
        <p className="small" style={{ marginTop: 16 }}>
          {c.partnerBand.contact}
          {c.owner.name} <a href={SITE.telHref}>{tel}</a>
        </p>
      </div>
    </section>
  );
}
