import Image from 'next/image';
import Link from 'next/link';
import FeeCalculator from '@/components/FeeCalculator';
import ValidatorCard from '@/components/ValidatorCard';
import { SITE } from '@/lib/site';
import { getContent } from '@/lib/content';
import { href } from '@/lib/i18n';
import { sortedNews, formatNewsDate } from '@/lib/news';

function SectionHead({ kicker, title, id }) {
  return (
    <div className="section-head">
      <p className="kicker">{kicker}</p>
      <h2 id={id}>{title}</h2>
    </div>
  );
}

// Big price with the currency in small type: "100円", "¥100", "100日元"
function Price({ lang, value }) {
  if (lang === 'en') {
    return (
      <>
        <span className="small">¥</span>
        {value}
      </>
    );
  }
  return (
    <>
      {value}
      <span className="small">{lang === 'zh' ? '日元' : '円'}</span>
    </>
  );
}

function jsonLd(c, lang) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ParkingFacility',
    name: c.name,
    alternateName: lang === 'ja' ? undefined : SITE.nameJa,
    description: c.description,
    url: `${SITE.url}${href(lang, '/') === '/' ? '' : href(lang, '/')}`,
    inLanguage: lang === 'zh' ? 'zh-Hans' : lang,
    image: `${SITE.url}/images/front.jpg`,
    telephone: SITE.telIntl,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'JP',
      addressRegion: SITE.address.region,
      addressLocality: SITE.address.locality,
      streetAddress: SITE.address.street,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
    maximumAttendeeCapacity: SITE.capacity,
    paymentAccepted: 'Cash, Credit Card, IC card (PASMO, Suica)',
    amenityFeature: [
      { '@type': 'LocationFeatureSpecification', name: 'EV charging', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Restroom', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Wheelchair-accessible parking', value: true },
    ],
    parentOrganization: { '@type': 'Organization', name: c.owner.name, telephone: SITE.telIntl },
  };
  if (SITE.geo) data.geo = { '@type': 'GeoCoordinates', latitude: SITE.geo.lat, longitude: SITE.geo.lng };
  // Escape "<" so the JSON can never close the script tag.
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export default function HomeView({ lang = 'ja' }) {
  const c = getContent(lang);
  const news = sortedNews(lang).slice(0, 3);
  const hl = lang === 'zh' ? 'zh-CN' : lang;
  const mapsEmbed = `https://www.google.com/maps?q=${encodeURIComponent(SITE.mapsQuery)}&hl=${hl}&output=embed`;
  const mapsDirections = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(SITE.mapsQuery)}&hl=${hl}`;
  const tel = lang === 'ja' ? SITE.tel : SITE.telIntl;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(c, lang) }} />

      <section className="hero">
        <div className="wrap hero-inner">
          <div>
            <p className="eyebrow">{c.hero.eyebrow}</p>
            <h1>
              {c.hero.h1[0]}
              <br />
              {c.hero.h1[1]}
            </h1>
            {lang !== 'ja' && (
              <p className="eyebrow" lang="ja" style={{ marginTop: 8 }}>
                {SITE.nameJa}
              </p>
            )}
            <p className="lead">{c.hero.lead}</p>
            <div className="hero-cta">
              <a className="btn btn-primary" href="#rates">
                {c.hero.cta.rates}
              </a>
              <a className="btn btn-ghost" href="#calc">
                {c.hero.cta.calc}
              </a>
              <a className="btn btn-ghost" href="#access">
                {c.hero.cta.access}
              </a>
              <a className="btn btn-ghost" href="#monthly">
                {c.hero.cta.monthly}
              </a>
            </div>
            <ul className="hero-facts">
              {c.hero.facts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
          <Image src="/images/front.jpg" alt={c.hero.imgAlt} width={1600} height={900} priority sizes="(min-width: 900px) 560px, 100vw" />
        </div>
      </section>

      {news.length > 0 && (
        <section className="wrap section" aria-labelledby="news-h">
          <SectionHead kicker="NEWS" title={c.news.title} id="news-h" />
          <ul className="news-list">
            {news.map((n) => (
              <li key={n.slug}>
                <Link href={href(lang, `/news/${n.slug}`)}>
                  <span className="num small muted">{formatNewsDate(n.date)}</span>
                  <span className={`badge ${n.category}`}>{c.news.categories[n.category] || n.category}</span>
                  <span>{n.title}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="small">
            <Link href={href(lang, '/news')}>{c.news.all}</Link>
          </p>
        </section>
      )}

      <section id="rates" className="wrap section" aria-labelledby="rates-h">
        <SectionHead kicker="RATES" title={c.rates.title} id="rates-h" />
        <p>
          <strong>{c.rates.subtitle}</strong>
        </p>
        <div className="grid">
          {c.rates.cards.map((r) => (
            <div key={r.key} className={`card rate${r.accent ? ' accent' : ''}`}>
              <div className="row">
                <strong>{r.band}</strong>
                <span className="num muted small">{r.hours}</span>
              </div>
              <div className="price">
                <Price lang={lang} value={r.price} /> <span className="small muted">/ {r.per}</span>
              </div>
              <div className="cap">
                {c.rates.max} <strong className="num">{c.yen(r.cap)}</strong>
              </div>
            </div>
          ))}
        </div>
        <div className="notes">
          {c.rates.notes.map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>

        <div id="calc" className="card" style={{ marginTop: 24 }} aria-labelledby="calc-h">
          <h3 id="calc-h" style={{ margin: 0, fontSize: 20 }}>
            {c.calc.title}
          </h3>
          <p className="small muted" style={{ margin: '4px 0 0' }}>
            {c.calc.intro}
          </p>
          <FeeCalculator lang={lang} />
        </div>
      </section>

      <section id="access" className="wrap section" aria-labelledby="access-h">
        <SectionHead kicker="ACCESS" title={c.access.title} id="access-h" />
        <div className="grid" style={{ alignItems: 'start' }}>
          <div className="card">
            <p style={{ marginTop: 0 }}>
              <strong>{c.addressFull}</strong>
            </p>
            <ul>
              {c.access.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
            {c.access.navNote && (
              <p className="small">
                {c.access.navNote}
                <br />
                <strong lang="ja">{SITE.addressJa}</strong>
                <br />
                TEL <strong className="num">{SITE.tel}</strong>
              </p>
            )}
            <a className="btn btn-primary" href={mapsDirections} target="_blank" rel="noopener noreferrer">
              {c.access.directions}
            </a>
          </div>
          <iframe className="map" title={c.access.mapTitle} src={mapsEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
      </section>

      <section className="wrap section" aria-labelledby="facility-h">
        <SectionHead kicker="FACILITY" title={c.facility.title} id="facility-h" />
        <div className="grid compact">
          {c.facility.items.map((a) => (
            <div key={a.t} className="card">
              <strong>{a.t}</strong>
              <div className="small muted">{a.d}</div>
            </div>
          ))}
        </div>
        <div className="grid" style={{ marginTop: 12 }}>
          <Image src="/images/side.jpg" alt={c.facility.sideAlt} width={1600} height={900} sizes="(min-width: 900px) 590px, 100vw" style={{ borderRadius: 16 }} />
          <Image src="/images/corner.jpg" alt={c.facility.cornerAlt} width={1600} height={900} sizes="(min-width: 900px) 590px, 100vw" style={{ borderRadius: 16 }} />
        </div>
      </section>

      <section id="vehicles" className="wrap section" aria-labelledby="veh-h">
        <SectionHead kicker="VEHICLES" title={c.vehicles.title} id="veh-h" />
        <div className="grid">
          {c.vehicles.ok.map((v) => (
            <div key={v.name} className="card">
              <strong>{v.name}</strong>
              <div className="small">{v.size}</div>
              <div className="small muted">
                {c.vehicles.example}
                {v.ex}
              </div>
            </div>
          ))}
        </div>
        <p className="small">
          <strong>{c.vehicles.ngLabel}</strong>
          {c.vehicles.ng.join(c.vehicles.sep)}
        </p>
      </section>

      <section id="monthly" className="wrap section" aria-labelledby="monthly-h">
        <SectionHead kicker="MONTHLY" title={c.monthly.title} id="monthly-h" />
        <div className="grid" style={{ alignItems: 'start' }}>
          <div className="card">
            <div>
              {c.monthly.fee}{' '}
              <strong className="num" style={{ fontSize: 28 }}>
                {c.yen(SITE.monthlyFee)}
              </strong>
              <span className="small muted">{c.monthly.feeNote}</span>
            </div>
            <div>
              {c.monthly.initial} <strong className="num">{c.yen(SITE.monthlyInitial)}</strong>
              <span className="small muted">{c.monthly.initialNote}</span>
            </div>
            <ul className="tags" style={{ marginTop: 12 }}>
              {c.monthly.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div className="card">
            <strong>{c.monthly.stepsTitle}</strong>
            <ol>
              {c.monthly.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <a className="btn btn-primary" href={SITE.parkDirectUrl} target="_blank" rel="noopener noreferrer">
              {c.monthly.cta}
            </a>
            <p className="small muted">{c.monthly.note}</p>
          </div>
        </div>
      </section>

      <section id="support" className="wrap section" aria-labelledby="sup-h">
        <SectionHead kicker="SUPPORT" title={c.help.title} id="sup-h" />
        <div className="band">
          <h3 style={{ marginTop: 0 }}>
            {c.support.name}
            {lang === 'en' ? ` (${c.support.hours})` : `（${c.support.hours}）`}
          </h3>
          <p>{c.help.intro}</p>
          {c.help.langNote && <p className="small">{c.help.langNote}</p>}
          <p className="small">
            {c.help.operatorBy}
            {c.support.operator}
          </p>
        </div>
        <div className="grid" style={{ marginTop: 12 }}>
          {c.help.cards.map((h) => (
            <div key={h.label} className="card">
              <span className="small muted">{h.label}</span>
              <div>
                {h.value === 'owner' ? (
                  <>
                    <strong>{c.owner.name}</strong> <a href={SITE.telHref}>{tel}</a>
                  </>
                ) : (
                  <>
                    <strong>{h.value}</strong>
                    {h.extra}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="partners" className="wrap section" aria-labelledby="partner-h">
        <div className="band">
          <h2 id="partner-h" style={{ marginTop: 0 }}>
            {c.partnerBand.title}
          </h2>
          <p>{c.partnerBand.text}</p>
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

      <section className="wrap section" aria-labelledby="sec-h">
        <SectionHead kicker="SECURITY" title={c.security.title} id="sec-h" />
        <div className="grid">
          {c.security.items.map((s) => (
            <div key={s.t} className="card">
              <strong>{s.t}</strong>
              <div className="small muted">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap section faq" aria-labelledby="faq-h">
        <SectionHead kicker="FAQ" title={c.faq.title} id="faq-h" />
        {c.faq.items.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>
    </>
  );
}
