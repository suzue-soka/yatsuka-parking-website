// お知らせ. Later this list comes from the admin screen (Supabase).
// category: '工事' | 'メンテナンス' | '料金改定' | 'お知らせ' (labels per language in lib/content)
// Each item has Japanese text plus optional en / zh translations; missing translations fall back to Japanese.

export const NEWS = [
  {
    slug: 'equipment-replacement-2027',
    date: '2026-11-20',
    category: '工事',
    title: '駐車場設備入替工事のお知らせ（2027年1月29日〜2月1日）',
    body: [
      '現在の設備を新しいナンバー認証システムに入れ替える工事を行います。工事期間は2027年1月29日（金）から2月1日（月）までです。',
      '工事期間中も駐車場はご利用いただけます。精算機とゲートは停止し、入出庫の管理・記録は行いません。そのまま入出庫してください。',
      '時間貸しのお客様：工事期間中の駐車料金はいただきません。工事期間中に入庫し、2月2日以降に出庫される場合は、新システムの稼働開始時刻（2月2日 0:00予定）から料金を計算します。',
      '月極契約のお客様：工事期間中は月極定期券を使用せずに入出庫していただきます。',
      '稼働開始時刻は工事の進捗により変更となる場合があります。変更時は場内掲示とこのページでお知らせします。',
      'ご不便をおかけしますが、ご理解とご協力をお願いいたします。',
    ],
    en: {
      title: 'Equipment replacement work: 29 January to 1 February 2027',
      body: [
        'We are replacing the current equipment with a new licence-plate recognition system. The work runs from Friday 29 January to Monday 1 February 2027.',
        'The car park stays open during the work. The pay machines and gates will be off, and entry and exit will not be controlled or recorded. Please drive in and out as you are.',
        'Hourly parking: there is no charge during the work. If you enter during the work and leave on or after 2 February, the fee is counted from the start of the new system (planned for 0:00 on 2 February).',
        'Monthly contract holders: please enter and leave without using your pass during the work.',
        'The start time may change depending on the progress of the work. Any change will be posted at the car park and on this page.',
        'We apologise for the inconvenience and thank you for your understanding.',
      ],
    },
    zh: {
      title: '停车场设备更换施工通知（2027年1月29日至2月1日）',
      body: [
        '本停车场将把现有设备更换为新的车牌识别系统。施工时间为2027年1月29日（周五）至2月1日（周一）。',
        '施工期间停车场照常开放。缴费机和道闸将停止运行，不进行出入场管理和记录，请直接出入。',
        '临时停车的顾客：施工期间不收取停车费。施工期间入场、2月2日以后出场的，从新系统启用时间（预定2月2日0:00）起计费。',
        '月租合同的顾客：施工期间无需使用月租卡，请直接出入。',
        '启用时间可能因施工进度而变更。如有变更，将在场内公告和本页面通知。',
        '给您带来不便，敬请谅解与配合。',
      ],
    },
  },
  {
    slug: 'ticketless-from-2027-02-02',
    date: '2026-11-20',
    category: 'お知らせ',
    title: '2027年2月2日からナンバー認証（チケットレス）方式に切り替わります',
    body: [
      '2027年2月2日（火）から、カメラが車両ナンバーを読み取るチケットレス方式に切り替わります。入庫時の駐車券の発行はありません。',
      '出庫の際は、出口の精算機でお支払いください。時間貸しの料金は変わりません。',
      'お支払い方法が増えます。現金に加えて、クレジットカードと電子マネー（交通系IC（PASMO・Suica 等）・nanaco・楽天Edy・WAON・iD・QUICPay）がご利用いただけます。',
      '月極契約のお客様は、登録した車両ナンバーで入出庫できます。月極定期券は不要になります。ご返却の必要はありません。',
    ],
    en: {
      title: 'Ticketless entry by licence-plate recognition from 2 February 2027',
      body: [
        'From Tuesday 2 February 2027, cameras will read your licence plate and no ticket will be issued at the entrance.',
        'Please pay at the exit pay machine when you leave. Hourly rates stay the same.',
        'More ways to pay: besides cash, you can use credit cards and e-money (transit IC cards such as PASMO and Suica, nanaco, Rakuten Edy, WAON, iD, QUICPay).',
        'Monthly contract holders enter and leave by their registered plate. Passes are no longer needed and do not have to be returned.',
      ],
    },
    zh: {
      title: '自2027年2月2日起改为车牌识别（无票）方式',
      body: [
        '自2027年2月2日（周二）起，改为由摄像头识别车牌的无票方式。入场时不再发放停车票。',
        '出场时请在出口缴费机付款。临时停车收费标准不变。',
        '支付方式增加：除现金外，还可使用信用卡和电子货币（PASMO、Suica 等交通IC卡、nanaco、乐天Edy、WAON、iD、QUICPay）。',
        '月租合同的顾客凭登记的车牌出入。不再需要月租卡，也无需归还。',
      ],
    },
  },
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
