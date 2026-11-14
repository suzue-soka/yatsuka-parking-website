import Image from 'next/image';
import Link from 'next/link';
import FeeCalculator from '@/components/FeeCalculator';
import ValidatorCard from '@/components/ValidatorCard';
import { SITE, RATE_CARDS, PAYMENT_NOTE, AMENITIES, VEHICLES_OK, VEHICLES_NG, MONTHLY, PARTNER_FEATURES, SECURITY, FAQS } from '@/lib/site';
import { sortedNews, formatNewsDate } from '@/lib/news';

export const metadata = {
  alternates: { canonical: '/' },
};

function SectionHead({ kicker, title, id }) {
  return (
    <div className="section-head">
      <p className="kicker">{kicker}</p>
      <h2 id={id}>{title}</h2>
    </div>
  );
}

function jsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ParkingFacility',
    name: SITE.name,
    description: SITE.description,
    url: SITE.url,
    image: `${SITE.url}/images/front.jpg`,
    telephone: SITE.owner.tel,
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
    paymentAccepted: '現金, クレジットカード, 交通系IC',
    amenityFeature: [
      { '@type': 'LocationFeatureSpecification', name: 'EV充電', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'トイレ', value: true },
      { '@type': 'LocationFeatureSpecification', name: '車いす使用者用区画', value: true },
    ],
    parentOrganization: { '@type': 'Organization', name: SITE.owner.name, telephone: SITE.owner.tel },
  };
  if (SITE.geo) data.geo = { '@type': 'GeoCoordinates', latitude: SITE.geo.lat, longitude: SITE.geo.lng };
  // Escape "<" so the JSON can never close the script tag.
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export default function Home() {
  const news = sortedNews().slice(0, 3);
  const mapsEmbed = `https://www.google.com/maps?q=${encodeURIComponent(SITE.mapsQuery)}&output=embed`;
  const mapsDirections = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(SITE.mapsQuery)}`;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd() }} />

      <section className="hero">
        <div className="wrap hero-inner">
          <div>
            <p className="eyebrow">埼玉県草加市・東武スカイツリーライン 谷塚駅</p>
            <h1>
              谷塚駅すぐの
              <br />
              駐車場・月極駐車場
            </h1>
            <p className="lead">
              {SITE.walk}、24時間営業の自走式立体駐車場です。収容{SITE.capacity}台。時間貸し・月極のどちらもご利用いただけます。
            </p>
            <div className="hero-cta">
              <a className="btn btn-primary" href="#rates">
                料金を見る
              </a>
              <a className="btn btn-ghost" href="#calc">
                料金を計算する
              </a>
              <a className="btn btn-ghost" href="#access">
                アクセス
              </a>
              <a className="btn btn-ghost" href="#monthly">
                月極契約
              </a>
            </div>
            <ul className="hero-facts">
              <li>24時間営業</li>
              <li>収容{SITE.capacity}台</li>
              <li>高さ制限{SITE.heightLimit}</li>
              <li>EV充電</li>
            </ul>
          </div>
          <Image
            src="/images/front.jpg"
            alt="谷塚駅東口共同駐車場の外観。自走式立体駐車場です"
            width={1600}
            height={900}
            priority
            sizes="(min-width: 900px) 560px, 100vw"
          />
        </div>
      </section>

      {news.length > 0 && (
        <section className="wrap section" aria-labelledby="news-h">
          <SectionHead kicker="NEWS" title="お知らせ" id="news-h" />
          <ul className="news-list">
            {news.map((n) => (
              <li key={n.slug}>
                <Link href={`/news/${n.slug}`}>
                  <span className="num small muted">{formatNewsDate(n.date)}</span>
                  <span className={`badge ${n.category}`}>{n.category}</span>
                  <span>{n.title}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="small">
            <Link href="/news">お知らせ一覧へ</Link>
          </p>
        </section>
      )}

      <section id="rates" className="wrap section" aria-labelledby="rates-h">
        <SectionHead kicker="RATES" title="料金" id="rates-h" />
        <p>
          <strong>{SITE.name}（時間貸し）</strong>
        </p>
        <div className="grid">
          {RATE_CARDS.map((r) => (
            <div key={r.band} className={`card rate${r.accent ? ' accent' : ''}`}>
              <div className="row">
                <strong>{r.band}</strong>
                <span className="num muted small">{r.hours}</span>
              </div>
              <div className="price">
                {r.price}
                <span className="small">円</span> <span className="small muted">/ {r.per}</span>
              </div>
              <div className="cap">
                最大料金 <strong className="num">{r.cap}円</strong>
              </div>
            </div>
          ))}
        </div>
        <div className="notes">
          {PAYMENT_NOTE.map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>

        <div id="calc" className="card" style={{ marginTop: 24 }} aria-labelledby="calc-h">
          <h3 id="calc-h" style={{ margin: 0, fontSize: 20 }}>
            駐車料金シミュレーター
          </h3>
          <p className="small muted" style={{ margin: '4px 0 0' }}>
            入庫・出庫の予定日時を入力すると、料金の目安を計算します。時刻は24時間表記（日本時間）です。
          </p>
          <FeeCalculator />
        </div>
      </section>

      <section id="access" className="wrap section" aria-labelledby="access-h">
        <SectionHead kicker="ACCESS" title="アクセス" id="access-h" />
        <div className="grid" style={{ alignItems: 'start' }}>
          <div className="card">
            <p style={{ marginTop: 0 }}>
              <strong>{SITE.address.full}</strong>
            </p>
            <ul>
              <li>東武スカイツリーライン {SITE.walk}</li>
              <li>入口と出口が分かれています</li>
              <li>高さ制限 {SITE.heightLimit}</li>
            </ul>
            <a className="btn btn-primary" href={mapsDirections} target="_blank" rel="noopener noreferrer">
              Google マップで道順を見る
            </a>
          </div>
          <iframe
            className="map"
            title="谷塚駅東口共同駐車場の地図"
            src={mapsEmbed}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>

      <section className="wrap section" aria-labelledby="facility-h">
        <SectionHead kicker="FACILITY" title="施設のご案内" id="facility-h" />
        <div className="grid compact">
          {AMENITIES.map((a) => (
            <div key={a.t} className="card">
              <strong>{a.t}</strong>
              <div className="small muted">{a.d}</div>
            </div>
          ))}
        </div>
        <div className="grid" style={{ marginTop: 12 }}>
          <Image src="/images/side.jpg" alt="駐車場の側面。各階に駐車スペースがあります" width={1600} height={900} sizes="(min-width: 900px) 590px, 100vw" style={{ borderRadius: 16 }} />
          <Image src="/images/corner.jpg" alt="駐車場の角から見た外観" width={1600} height={900} sizes="(min-width: 900px) 590px, 100vw" style={{ borderRadius: 16 }} />
        </div>
      </section>

      <section id="vehicles" className="wrap section" aria-labelledby="veh-h">
        <SectionHead kicker="VEHICLES" title="駐車できる車両" id="veh-h" />
        <div className="grid">
          {VEHICLES_OK.map((v) => (
            <div key={v.name} className="card">
              <strong>{v.name}</strong>
              <div className="small">{v.size}</div>
              <div className="small muted">例：{v.ex}</div>
            </div>
          ))}
        </div>
        <p className="small">
          <strong>ご利用いただけない車両：</strong>
          {VEHICLES_NG.join('、')}
        </p>
      </section>

      <section id="monthly" className="wrap section" aria-labelledby="monthly-h">
        <SectionHead kicker="MONTHLY" title="月極駐車場" id="monthly-h" />
        <div className="grid" style={{ alignItems: 'start' }}>
          <div className="card">
            <div>
              月額使用料 <strong className="num" style={{ fontSize: 28 }}>{MONTHLY.fee}円</strong>
              <span className="small muted">（税込・管理費等含む）</span>
            </div>
            <div>
              初期費用 <strong className="num">{MONTHLY.initial}円</strong>
              <span className="small muted">（税込・お申し込み時のみ）</span>
            </div>
            <ul className="tags" style={{ marginTop: 12 }}>
              {MONTHLY.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          <div className="card">
            <strong>お申し込みの流れ</strong>
            <ol>
              {MONTHLY.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <a className="btn btn-primary" href={SITE.parkDirectUrl} target="_blank" rel="noopener noreferrer">
              Park Directで空き確認・申込
            </a>
            <p className="small muted">月極駐車場の契約・お支払いは Park Direct（株式会社ニーリー）が取り扱います。</p>
          </div>
        </div>
      </section>

      <section id="support" className="wrap section" aria-labelledby="sup-h">
        <SectionHead kicker="SUPPORT" title="お困りのときは" id="sup-h" />
        <div className="band">
          <h3 style={{ marginTop: 0 }}>
            {SITE.support.name}（{SITE.support.hours}）
          </h3>
          <p>
            精算機のインターホン（カメラ付き遠隔通信装置）から、オペレーターに直接つながります。駐車料金の精算、駐車券の紛失、事故や機器の故障など、場内でのトラブルはその場でご相談ください。
          </p>
          <p className="small">運営：{SITE.support.operator}</p>
        </div>
        <div className="grid" style={{ marginTop: 12 }}>
          <div className="card">
            <span className="small muted">時間貸し（料金・精算・事故・故障）</span>
            <div>
              <strong>精算機のインターホン</strong>（24時間）
            </div>
          </div>
          <div className="card">
            <span className="small muted">月極駐車場</span>
            <div>
              <strong>Park Direct</strong>
            </div>
          </div>
          <div className="card">
            <span className="small muted">提携店舗制度・その他</span>
            <div>
              <strong>{SITE.owner.name}</strong> <a href={SITE.owner.telHref}>{SITE.owner.tel}</a>
            </div>
          </div>
        </div>
      </section>

      <section id="partners" className="wrap section" aria-labelledby="partner-h">
        <div className="band">
          <h2 id="partner-h" style={{ marginTop: 0 }}>
            提携店舗を募集しています
          </h2>
          <p>
            お客様の駐車料金を店舗様が負担する「提携店舗制度」。お車で来店しやすくなり、集客につながります。お申し込みから利用状況・請求の確認まで、オンラインで行えます（提携店舗ポータルは準備中です）。
          </p>
          <div className="grid">
            {PARTNER_FEATURES.map((f) => (
              <div key={f.t}>
                <strong>{f.t}</strong>
                <p className="small" style={{ margin: 0 }}>
                  {f.d}
                </p>
              </div>
            ))}
          </div>
          <ValidatorCard />
          <p style={{ marginBottom: 0 }}>
            お問い合わせ：{SITE.owner.name} <a href={SITE.owner.telHref}>{SITE.owner.tel}</a>
          </p>
        </div>
      </section>

      <section className="wrap section" aria-labelledby="sec-h">
        <SectionHead kicker="SECURITY" title="セキュリティへの取り組み" id="sec-h" />
        <div className="grid">
          {SECURITY.map((s) => (
            <div key={s.t} className="card">
              <strong>{s.t}</strong>
              <div className="small muted">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap section faq" aria-labelledby="faq-h">
        <SectionHead kicker="FAQ" title="よくあるご質問" id="faq-h" />
        {FAQS.map((f) => (
          <details key={f.q}>
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>
    </>
  );
}
