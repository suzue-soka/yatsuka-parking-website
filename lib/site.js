// Language-neutral facts about the car park. Text in each language lives in lib/content/{ja,en,zh}.js.

export const SITE = {
  // Public address (domain registered 2026-11-20). NEXT_PUBLIC_SITE_URL overrides it if ever needed.
  url: process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'production' ? 'https://www.yatsuka-parking.jp' : 'http://localhost:3000'),
  nameJa: '谷塚駅東口共同駐車場',
  addressJa: '埼玉県草加市瀬崎1丁目7-20',
  address: { region: '埼玉県', locality: '草加市', street: '瀬崎1丁目7-20' },
  geo: null, // TODO: set { lat, lng } of the entrance after checking on Google Maps
  capacity: 300,
  heightLimit: '2.10m',
  mapsQuery: '谷塚駅東口共同駐車場 埼玉県草加市瀬崎1丁目7-20',
  tel: '048-924-2401',
  telIntl: '+81-48-924-2401',
  telHref: 'tel:0489242401',
  // Park Direct support line (from the Park Direct hearing sheet; shown in the MONTHLY section, owner 2026-11-27)
  parkDirectTel: '050-3173-9036',
  parkDirectTelHref: 'tel:05031739036',
  parkDirectUrl:
    'https://www.park-direct.jp/shosai/PRBJRgIp9z7LjPO0thXM-RCPDT5i4gYbUUA-EU0DpbA/G000240966',
  monthlyFee: '17,820',
  monthlyInitial: '16,500',
  validatorImage: '/images/qr-validator.jpg',
  validatorPrice: '46,200',
};
