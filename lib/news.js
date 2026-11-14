// お知らせ. Later this list comes from the admin screen (Supabase).
// category: '工事' | 'メンテナンス' | '料金改定' | 'お知らせ' (labels per language in lib/content)
// Each item has Japanese text plus optional en / zh translations; missing translations fall back to Japanese.

export const NEWS = [
  {
    slug: 'website-open',
    date: '2026-12-01', // TODO: set to the launch date
    category: 'お知らせ',
    title: '公式ウェブサイトを公開しました',
    body: [
      '谷塚駅東口共同駐車場の公式ウェブサイトを公開しました。',
      '料金・アクセス・月極駐車場のご案内のほか、入庫・出庫の予定日時から料金の目安を計算できる「料金シミュレーター」をご用意しています。',
      'ウェブサイトは日本語・英語・中国語（簡体字）でご覧いただけます。',
      '今後、工事やメンテナンスのお知らせもこちらに掲載します。',
    ],
    en: {
      title: 'Our official website is now open',
      body: [
        'The official website of Yatsuka Station East Exit Parking is now open.',
        'Besides rates, directions and monthly parking information, it has a fee calculator that estimates your parking fee from your arrival and departure times.',
        'The website is available in Japanese, English and Simplified Chinese.',
        'Notices about construction and maintenance will also be posted here.',
      ],
    },
    zh: {
      title: '官方网站正式上线',
      body: [
        '谷塚站东口共同停车场官方网站现已上线。',
        '除收费标准、交通指南和月租停车信息外，还提供可根据预计入场和出场时间估算费用的"停车费计算器"。',
        '本网站提供日文、英文和简体中文版本。',
        '今后施工和维护等通知也将在此发布。',
      ],
    },
  },
];

function localize(item, lang) {
  const t = lang !== 'ja' && item[lang];
  return { slug: item.slug, date: item.date, category: item.category, title: t?.title || item.title, body: t?.body || item.body };
}

export function sortedNews(lang = 'ja') {
  return [...NEWS].sort((a, b) => (a.date < b.date ? 1 : -1)).map((n) => localize(n, lang));
}

export function findNews(slug, lang = 'ja') {
  const item = NEWS.find((n) => n.slug === slug);
  return item ? localize(item, lang) : undefined;
}

export function formatNewsDate(iso) {
  return iso.replaceAll('-', '.');
}
