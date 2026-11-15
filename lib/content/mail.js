// Emails sent by the site to partners (ja / en / zh). Plain text + simple HTML.
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const SIGN = {
  ja: ['谷塚駅東口共同駐車場', '株式会社鈴江', '埼玉県草加市瀬崎1-7-20', 'TEL 048-924-2401'],
  en: ['Yatsuka Station East Exit Parking', 'Suzue Co., Ltd.', '1-7-20 Sezaki, Soka-shi, Saitama, Japan', 'TEL +81-48-924-2401'],
  zh: ['谷塚站东口共同停车场', '株式会社铃江', '埼玉县草加市濑崎1-7-20', 'TEL 048-924-2401'],
};

const T = {
  ja: {
    sep: '：',
    subject: (code) => `【谷塚駅東口共同駐車場】認証機を発送しました（${code}）`,
    hello: (name) => `${name} 御中`,
    intro: '平素より谷塚駅東口共同駐車場をご利用いただき、誠にありがとうございます。\nご購入いただいた認証機を、以下のとおり発送いたしました。',
    rows: { model: '機種', serial: '製造番号', shipped: '発送日', carrier: '配送業者', tracking: '伝票番号' },
    track: (name) => `配送状況は、${name}のサイトで伝票番号を入力するとご確認いただけます。`,
    after: '到着・設置後、ご利用開始日をご連絡いたします。発送情報は提携店舗ページ（認証機・お支払い）でもご確認いただけます。',
    portal: '提携店舗ページ',
    dn: '納品書（PDF）',
    note: 'ご不明な点は、このメールにご返信いただくか、お電話でお問い合わせください。',
  },
  en: {
    sep: ': ',
    subject: (code) => `[Yatsuka Station East Exit Parking] Your validation machine has been shipped (${code})`,
    hello: (name) => `Dear ${name},`,
    intro: 'Thank you for joining the partner program of Yatsuka Station East Exit Parking.\nThe validation machine you purchased has been shipped as follows.',
    rows: { model: 'Model', serial: 'Serial number', shipped: 'Shipped on', carrier: 'Carrier', tracking: 'Tracking number' },
    track: (name) => `You can follow the delivery by entering the tracking number on the ${name} website (it may be in Japanese only).`,
    after: 'Once the machine has arrived and been installed, we will tell you the date your service starts. The shipping details are also on your partner page (Machine & payments).',
    portal: 'Partner page',
    dn: 'Delivery note (PDF, Japanese)',
    note: 'If you have any questions, simply reply to this email or call us.',
  },
  zh: {
    sep: '：',
    subject: (code) => `【谷塚站东口共同停车场】验证机已发货（${code}）`,
    hello: (name) => `${name} 您好：`,
    intro: '感谢您加入谷塚站东口共同停车场的合作店铺计划。\n您购买的验证机已按以下信息发货。',
    rows: { model: '机型', serial: '序列号', shipped: '发货日期', carrier: '快递公司', tracking: '运单号' },
    track: (name) => `在${name}网站输入运单号即可查询配送状态（网站可能仅有日语）。`,
    after: '验证机到达并安装后，我们将通知您开始使用的日期。发货信息也可在合作店铺页面（验证机・付款）查看。',
    portal: '合作店铺页面',
    dn: '交货单（PDF，日语）',
    note: '如有疑问，请直接回复本邮件或致电联系我们。',
  },
};

/** Email to the partner when the validation machine has been shipped. */
export function shippedMail(lang, d) {
  const t = T[lang] || T.ja;
  const sign = SIGN[lang] || SIGN.ja;
  const rows = [
    [t.rows.model, d.model],
    [t.rows.serial, d.serial || '—'],
    [t.rows.shipped, d.shippedOn || '—'],
    [t.rows.carrier, d.carrierName || '—'],
    [t.rows.tracking, d.tracking || '—'],
  ];
  const trackLine = d.tracking && d.carrierUrl ? t.track(d.carrierName) : '';
  const text = [
    t.hello(d.name),
    '',
    t.intro,
    '',
    ...rows.map(([k, v]) => `${k}${t.sep}${v}`),
    '',
    ...(trackLine ? [trackLine, d.carrierUrl, ''] : []),
    t.after,
    `${t.portal}${t.sep}${d.portalUrl}`,
    ...(d.deliveryNoteUrl ? [`${t.dn}${t.sep}${d.deliveryNoteUrl}`] : []),
    '',
    t.note,
    '',
    '――――――――――',
    ...sign,
  ].join('\n');
  const html = `<div style="font-family:sans-serif;font-size:15px;line-height:1.7;color:#1d2733">
<p>${esc(t.hello(d.name))}</p>
<p>${esc(t.intro).replace(/\n/g, '<br>')}</p>
<table style="border-collapse:collapse;margin:12px 0">${rows
    .map(([k, v]) => `<tr><th style="text-align:left;padding:6px 16px 6px 0;color:#5b6472;font-weight:700">${esc(k)}</th><td style="padding:6px 0">${esc(v)}</td></tr>`)
    .join('')}</table>
${trackLine ? `<p>${esc(trackLine)}<br><a href="${esc(d.carrierUrl)}">${esc(d.carrierUrl)}</a></p>` : ''}
<p>${esc(t.after)}<br><a href="${esc(d.portalUrl)}">${esc(t.portal)}</a>${d.deliveryNoteUrl ? `<br><a href="${esc(d.deliveryNoteUrl)}">${esc(t.dn)}</a>` : ''}</p>
<p style="color:#5b6472;font-size:13px">${esc(t.note)}</p>
<p style="color:#5b6472;font-size:13px;border-top:1px solid #e3e7ed;padding-top:8px">${sign.map(esc).join('<br>')}</p>
</div>`;
  return { subject: t.subject(d.code), text, html };
}
