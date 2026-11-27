import { facilityIconSvg } from '@/lib/facility-icons';
import { vehicleLimitIconSvg } from '@/lib/vehicle-limit-icons';
import Image from 'next/image';
import Link from 'next/link';
import FeeCalculator from '@/components/FeeCalculator';
import FacilityGrid from '@/components/FacilityGrid';
import ValidatorCard from '@/components/ValidatorCard';
import { SITE } from '@/lib/site';
import { getContent } from '@/lib/content';
import { href } from '@/lib/i18n';
import { sortedNews, formatNewsDate } from '@/lib/news';
import { programText } from '@/lib/content/program';

// Payment-method cards: shown in RATES on PC, in FACILITY on phones and tablets.
const PAY_ICONS = ['card', 'emoney', 'cash'];

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
    image: `${SITE.url}/images/hero.jpg`,
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

  // News list: phones keep it under the facility cards; PC shows it under MONTHLY (owner, 2026-11-20).
  const newsSection = (hid, cls) => (
        <section className={`wrap section ${cls}`} aria-labelledby={hid}>
          <SectionHead kicker="NEWS" title={c.news.title} id={hid} />
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
  );

  return (
    // .home-flow orders the sections: hero, VEHICLES, RATES, FACILITY (every screen size, owner 2026-11-27)
    // without changing the order on phones and tablets.
    <div className="home-flow">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(c, lang) }} />

      <section className="hero">
        <div className="wrap hero-inner">
          <div>
            <p className="eyebrow">{c.hero.eyebrow}</p>
            <h1>
              {c.hero.h1.map((line, i) => (
                <span key={line} className={i >= 2 ? 'h1-line h1-sub' : 'h1-line'}>
                  {line}
                </span>
              ))}
            </h1>
            {lang !== 'ja' && (
              <p className="eyebrow" lang="ja" style={{ marginTop: 8 }}>
                {SITE.nameJa}
              </p>
            )}
            <p className="lead">{c.hero.lead}</p>
          </div>
          <div className="hero-photo">
            <Image src="/images/hero.jpg" alt={c.hero.imgAlt} fill priority sizes="(min-width: 700px) 50vw, 100vw" />
          </div>
        </div>
      </section>

      {/* PC: vehicle limits as on the entrance sign, above FACILITY (owner, 2026-11-27).
          Phones and tablets keep the earlier section further down until the mobile pass. */}
      <section id="vehicles" className="wrap section pc-only" aria-labelledby="veh-pc-h">
        <SectionHead kicker="VEHICLES" title={c.vehicles.limitsTitle} id="veh-pc-h" />
        <div className="veh-strip">
          {c.vehicles.limits.map((v) => (
            <div key={v.icon} className="veh-tile">
              <span className="facility-icon" dangerouslySetInnerHTML={{ __html: vehicleLimitIconSvg(v.icon) }} />
              <div>
                <div className="veh-label">{v.label}</div>
                <strong className="veh-value">{v.value}</strong>
              </div>
            </div>
          ))}
        </div>
        <p className="small veh-other">{c.vehicles.ng.join(c.vehicles.sep)}</p>
      </section>

      <section className="wrap section" aria-labelledby="facility-h">
        <SectionHead kicker="FACILITY" title={c.facility.title} id="facility-h" />
        <FacilityGrid
          items={c.facility.items.map((a) => ({ ...a, svg: facilityIconSvg(a.icon) }))}
          labels={{ showAll: c.facility.showAll(c.facility.items.filter((a) => !PAY_ICONS.includes(a.icon)).length), showLess: c.facility.showLess }}
        />
      </section>

      <section id="rates" className="wrap section" aria-labelledby="rates-h">
        <SectionHead kicker="RATES" title={c.rates.title} id="rates-h" />
        <div className="rates-layout">
        <div className="rates-left">
        <p className="rates-sub rates-sub-row">
          <strong>
            <span className="rates-mobile">{c.rates.subtitle}</span>
            <span className="rates-pc">{c.rates.subtitlePc ?? c.rates.subtitle}</span>
          </strong>
          <span className="rates-pc rates-tax">{c.rates.taxPc ?? c.rates.notes[0]}</span>
        </p>
        <div className="grid rate-cards">
          {c.rates.cards.map((r) => (
            <div key={r.key} className={`card rate${r.accent ? ' accent' : ''}`}>
              <div className="row">
                <strong>{r.band}</strong>
                <span className="num muted small">{r.hours}</span>
              </div>
              <div className="price">
                <Price lang={lang} value={r.price} /> <span className="small muted"><span className="per-slash">/ </span>{String(r.per).match(/^[\d,.]+/)?.[0] ?? ''}<span className="per-unit">{String(r.per).replace(/^[\d,.]+/, '')}</span></span>
              </div>
              <div className="cap">
                <span className="cap-label">{c.rates.max}</span>{' '}
                <strong className="num">
                  <Price lang={lang} value={r.cap} />
                </strong>
              </div>
            </div>
          ))}
        </div>
        <div className="notes">
          {c.rates.notes.map((n, i) => (
            <span key={n} className={i === 1 ? 'note-pay' : i === 0 ? 'note-tax' : undefined}>{n}</span>
          ))}
        </div>
        {/* PC: payment methods live here in one headed card, one row per method: name and status, then the accepted brands or notes (owner, 2026-11-27)
            (option A, owner 2026-11-27); the card stretches to the bottom of the simulator frame, instead of in FACILITY. Cash first: the only method in
            use until 2027-02-02. Phones and tablets keep them in FACILITY. */}
        <div className="pc-only pay-block">
          <p className="rates-sub rates-sub-row pay-head">
            <strong>{c.rates.payTitle}</strong>
            <span className="rates-tax">{[c.rates.payAt, ...c.rates.payFoot].join(lang === 'en' ? ' · ' : '・')}</span>
          </p>
          <div className="card pay-card">
            <div className="pay-items">
            {['cash', 'card', 'emoney']
              .map((k) => c.facility.items.find((a) => a.icon === k))
              .filter(Boolean)
              .map((a) => (
                <div key={a.t} className="pay-item">
                  <span className="facility-icon" dangerouslySetInnerHTML={{ __html: facilityIconSvg(a.icon) }} />
                  <div className="pay-name">
                    <strong>{a.t}</strong>
                    {a.note && <div className="small facility-note">{a.note}</div>}
                  </div>
                  <div className="pay-brands">
                    {/* Cash has no start date: one sentence, "1,000円札と硬貨のみご利用いただけます。" (owner, 2026-11-27) */}
                    {(a.icon === 'cash' ? [c.rates.payCash] : a.brands ?? [a.d]).map((b, i, all) => (
                      <span key={b}>
                        {b}
                        {i < all.length - 1 ? (lang === 'en' ? ', ' : lang === 'zh' ? '、' : '・') : ''}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>

        <div id="calc" className="rates-calc" aria-label={c.calc.title}>
          <p className="rates-sub rates-sub-row rates-pc">
            <strong>{c.calc.title}</strong>
            <span className="rates-tax">{c.calc.pcNote}</span>
          </p>
          <div className="card">
            <div className="rates-mobile">
              <h3 style={{ margin: 0, fontSize: 20 }}>{c.calc.title}</h3>
              <p className="small muted" style={{ margin: '4px 0 0' }}>
                {c.calc.intro}
              </p>
            </div>
            <FeeCalculator lang={lang} />
          </div>
        </div>
        </div>
      </section>

      <section id="monthly" className="wrap section" aria-labelledby="monthly-h">
        <SectionHead kicker="MONTHLY" title={c.monthly.title} id="monthly-h" />
        {/* Everything inside one frame (owner, 2026-11-27) */}
        <div className="card monthly-card">
          <div>
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
            <p className="small muted" style={{ margin: '14px 0 0' }}>{c.monthly.note}</p>
            <p className="small" style={{ margin: '6px 0 0' }}>
              {c.monthly.telLabel}{lang === 'en' ? ': ' : '：'}
              <a href={SITE.parkDirectTelHref}>
                <strong className="num">{SITE.parkDirectTel}</strong>
              </a>{' '}
              <span className="muted">{c.monthly.telHours}</span>
            </p>
          </div>
          <div className="monthly-apply">
            <strong>{c.monthly.stepsTitle}</strong>
            <ol>
              {c.monthly.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <a className="btn btn-primary" href={SITE.parkDirectUrl} target="_blank" rel="noopener noreferrer">
              {c.monthly.cta}
            </a>
          </div>
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
                <li key={i} className={i.includes('2.10') ? 'rates-mobile' : undefined}>{i}</li>
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

      {news.length > 0 && newsSection('news-h-pc', 'rates-pc')}

      <section id="support" className="wrap section" aria-labelledby="sup-h">
        <SectionHead kicker="SUPPORT" title={c.help.title} id="sup-h" />
        <div className="band">
          <h3 style={{ marginTop: 0 }}>
            <span className="rates-mobile">
              {c.support.name}
              {lang === 'en' ? ` (${c.support.hours})` : `（${c.support.hours}）`}
            </span>
            <span className="rates-pc sup-pc">
              <a href={c.support.telHref} className="sup-tel">
                {c.support.tel}
              </a>
              <span>{c.support.name}</span>
              <span>{c.support.hours}</span>
            </span>
          </h3>
          <p>{c.help.intro}</p>
          <p className="rates-mobile" style={{ fontSize: 20, margin: '8px 0' }}>
            <span className="small">{c.support.telLabel} </span>
            <a href={c.support.telHref} style={{ color: 'inherit', fontWeight: 700 }}>
              {c.support.tel}
            </a>
          </p>
          {c.support.codeNote && <p className="small sup-code">{c.support.codeNote}</p>}
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
                    <strong>{c.owner.name}</strong> <a href={SITE.telHref}>{tel}</a> {c.footer.telHours}
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
          <p>
            <a className="btn btn-primary" href={`${href(lang, '/partners')}#apply`}>
              {programText(lang).applyCta}
            </a>
          </p>
          <p style={{ marginBottom: 0 }}>
            {c.partnerBand.contact}
            {c.owner.name} <a href={SITE.telHref}>{tel}</a> {c.footer.telHours}
          </p>
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
    </div>
  );
}
