// Delivery companies for shipping the validation machine. The admin types or picks the
// carrier name; partners get a link to that carrier's tracking page.
export const CARRIERS = [
  { match: /ヤマト|クロネコ|yamato/i, ja: 'ヤマト運輸', en: 'Yamato Transport', zh: '大和运输', url: 'https://toi.kuronekoyamato.co.jp/cgi-bin/tneko' },
  { match: /佐川|sagawa/i, ja: '佐川急便', en: 'Sagawa Express', zh: '佐川急便', url: 'https://www.sagawa-exp.co.jp/' },
  { match: /日本郵便|郵便|ゆうパック|japan ?post/i, ja: '日本郵便（ゆうパック）', en: 'Japan Post', zh: '日本邮政', url: 'https://www.post.japanpost.jp/' },
  { match: /西濃|カンガルー|seino/i, ja: '西濃運輸', en: 'Seino Transportation', zh: '西浓运输', url: 'https://www.seino.co.jp/' },
];

export function carrierFor(text) {
  return text ? CARRIERS.find((c) => c.match.test(text)) || null : null;
}
