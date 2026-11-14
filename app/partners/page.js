import { SITE, PARTNER_FEATURES } from '@/lib/site';

export const metadata = {
  title: '提携店舗のご案内',
  description: '谷塚駅東口共同駐車場の提携店舗のご案内。提携店舗をご利用のお客様は、店舗が駐車料金を負担するサービスがあります。',
  alternates: { canonical: '/partners' },
};

// The partner directory is filled from the partner system once each shop has
// agreed to be listed (Permission A). Until then no shop names are published.
export default function Partners() {
  return (
    <section className="wrap section">
      <div className="section-head">
        <p className="kicker">PARTNERS</p>
        <h1 style={{ margin: '4px 0 0', fontSize: 28 }}>提携店舗のご案内</h1>
      </div>
      <div className="card prose">
        <p style={{ marginTop: 0 }}>
          提携店舗をご利用のお客様は、店舗が駐車料金を負担するサービスがあります。ご利用の際は、各店舗でお申し出ください。
        </p>
        <p className="muted" style={{ marginBottom: 0 }}>
          提携店舗の一覧は準備中です。掲載に同意いただいた店舗から順に、店舗名・営業時間・サービス内容を掲載します。
        </p>
      </div>

      <div className="band" style={{ marginTop: 24 }}>
        <h2 style={{ marginTop: 0 }}>店舗・事業者の皆様へ</h2>
        <p>提携店舗制度にご参加いただくと、お客様の駐車料金を店舗様が負担し、お車での来店を後押しできます。</p>
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
        <p style={{ marginBottom: 0 }}>
          お問い合わせ：{SITE.owner.name} <a href={SITE.owner.telHref}>{SITE.owner.tel}</a>
        </p>
      </div>
    </section>
  );
}
