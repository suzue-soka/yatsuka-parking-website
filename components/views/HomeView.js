import { facilityIconSvg } from '@/lib/facility-icons';
import { partnerIconSvg } from '@/lib/partner-icons';
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
// Icons of the four partner benefits, in the order of c.partnerBand.features
const PARTNER_ICON_KEYS = ['visit', 'usage', 'invoice', 'machine'];
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
            <p className="small" style={{ margin: '14px 0 0' }}>
              {/* Park Direct's logo, supplied by Park Direct with permission to use it on this site (owner, 2026-11-27) */}
              <img className="pd-logo" src="/images/park-direct-logo.png" alt="Park Direct" width={612} height={112} />{' '}
              {/* No label: logo + number on one line; the number is in the logo's blue and never breaks (owner, 2026-11-27) */}
              <a className="pd-tel" href={SITE.parkDirectTelHref} aria-label={`Park Direct ${c.monthly.telLabel} ${SITE.parkDirectTel}`}>
                <strong className="num">{SITE.parkDirectTel}</strong>
              </a>
              <span className="muted" style={{ display: 'block' }}>{c.monthly.telHours}</span>
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

      {/* SUPPORT: same layout as the footer of our entrance sign (owner, 2026-11-27):
          lead line, AMS support-centre mark, name + hours, phone, site number, operator. */}
      <section id="support" className="wrap section" aria-labelledby="sup-h">
        <SectionHead kicker="SUPPORT" title={c.help.title} id="sup-h" />
        <div className="band sup-band">
          <p className="sup-lead">{c.help.signLead}</p>
          <div className="sup-row">
            <span className="sup-mark">
              <img src="/images/ams-support-center.png" alt={c.support.name} width={640} height={228} />
            </span>
            <div className="sup-main">
              <div className="sup-labels">
                <span>{c.support.name}</span>
                <span>{c.help.hoursShort}</span>
              </div>
              <a href={c.support.telHref} className="sup-tel">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                </svg>
                {c.support.tel}
              </a>
              <div className="sup-operator">
                {c.help.managedBy}
                {c.support.operator}
              </div>
            </div>
            <div className="sup-site">
              <div className="sup-labels">
                <span>{c.help.siteNoLabel}</span>
              </div>
              <div className="sup-siteno">{SITE.amsSiteNo}</div>
            </div>
          </div>
          {/* The lead line says when to make contact; these lines say how (owner, 2026-11-27) */}
          <ul className="small sup-how">
            {c.help.how.map((h) => (
              <li key={h.by}>
                <strong>{h.by}</strong>
                {lang === 'en' ? ': ' : '：'}
                {h.do}
              </li>
            ))}
          </ul>
          {c.help.langNote && <p className="small sup-note">{c.help.langNote}</p>}
        </div>
      </section>

      <section id="partners" className="wrap section" aria-labelledby="partner-h">
        <div className="band">
          <h2 id="partner-h" style={{ marginTop: 0 }}>
            {c.partnerBand.title}
          </h2>
          <p>{c.partnerBand.text}</p>
          {/* One icon per benefit, white tile on the navy band (owner, 2026-11-27) */}
          <div className="grid partner-features">
            {c.partnerBand.features.map((f, i) => (
              <div key={f.t} className="partner-feature">
                <span className="partner-icon" dangerouslySetInnerHTML={{ __html: partnerIconSvg(PARTNER_ICON_KEYS[i]) }} />
                <div>
                  <strong>{f.t}</strong>
                  <p className="small" style={{ margin: 0 }}>
                    {f.d}
                  </p>
                </div>
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
