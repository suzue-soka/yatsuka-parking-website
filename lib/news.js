// お知らせ. Later this list comes from the admin screen (Supabase).
// category: '工事' | 'メンテナンス' | '料金改定' | 'お知らせ'

export const NEWS = [
  {
    slug: 'website-open',
    date: '2026-12-01', // TODO: set to the launch date
    category: 'お知らせ',
    title: '公式ウェブサイトを公開しました',
    body: [
      '谷塚駅東口共同駐車場の公式ウェブサイトを公開しました。',
      '料金・アクセス・月極駐車場のご案内のほか、入庫・出庫の予定日時から料金の目安を計算できる「料金シミュレーター」をご用意しています。',
      '今後、工事やメンテナンスのお知らせもこちらに掲載します。',
    ],
  },
];

export function sortedNews() {
  return [...NEWS].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function findNews(slug) {
  return NEWS.find((n) => n.slug === slug);
}

export function formatNewsDate(iso) {
  return iso.replaceAll('-', '.');
}
