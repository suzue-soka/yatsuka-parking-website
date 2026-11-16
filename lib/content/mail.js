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
    rows: { model: '機種', machine: '認証機', serial: '製造番号', shipped: '発送日', carrier: '配送業者', tracking: '伝票番号' },
    track: (name) => `配送状況は、${name}のサイトで伝票番号を入力するとご確認いただけます。`,
    after: '認証機は到着後すぐにご利用いただけます（発送日からご利用中として登録しました）。納品書は提携店舗ページ（認証機）でもご確認いただけます。',
    portal: '提携店舗ページ',
    dn: '納品書（PDF）',
    note: 'ご不明な点は、このメールにご返信いただくか、お電話でお問い合わせください。',
  },
  en: {
    sep: ': ',
    subject: (code) => `[Yatsuka Station East Exit Parking] Your validation machine has been shipped (${code})`,
    hello: (name) => `Dear ${name},`,
    intro: 'Thank you for joining the partner program of Yatsuka Station East Exit Parking.\nThe validation machine you purchased has been shipped as follows.',
    rows: { model: 'Model', machine: 'Machine', serial: 'Serial number', shipped: 'Shipped on', carrier: 'Carrier', tracking: 'Tracking number' },
    track: (name) => `You can follow the delivery by entering the tracking number on the ${name} website (it may be in Japanese only).`,
    after: 'You can use the machine as soon as it arrives (your service is registered as active from the shipping date). The delivery note is also on your partner page (Machines).',
    portal: 'Partner page',
    dn: 'Delivery note (PDF, Japanese)',
    note: 'If you have any questions, simply reply to this email or call us.',
  },
  zh: {
    sep: '：',
    subject: (code) => `【谷塚站东口共同停车场】验证机已发货（${code}）`,
    hello: (name) => `${name} 您好：`,
    intro: '感谢您加入谷塚站东口共同停车场的合作店铺计划。\n您购买的验证机已按以下信息发货。',
    rows: { model: '机型', machine: '验证机', serial: '序列号', shipped: '发货日期', carrier: '快递公司', tracking: '运单号' },
    track: (name) => `在${name}网站输入运单号即可查询配送状态（网站可能仅有日语）。`,
    after: '验证机到达后即可使用（已从发货日起登记为使用中）。交货单也可在合作店铺页面（验证机）查看。',
    portal: '合作店铺页面',
    dn: '交货单（PDF，日语）',
    note: '如有疑问，请直接回复本邮件或致电联系我们。',
  },
};

/** Email to the partner when the validation machine has been shipped. */
export function shippedMail(lang, d) {
  const t = T[lang] || T.ja;
  const sign = SIGN[lang] || SIGN.ja;
  const machines = d.machines || [{ code: null, model: d.model, serial: d.serial }];
  const rows = [
    ...machines.flatMap((m) => [
      [m.code ? `${t.rows.machine} ${m.code}` : t.rows.model, m.model],
      [t.rows.serial, m.serial || '—'],
    ]),
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

const RQ = {
  ja: {
    subject: (code) => `【谷塚駅東口共同駐車場】認証機の追加申請を承認しました（${code}）`,
    intro: '平素より谷塚駅東口共同駐車場をご利用いただき、誠にありがとうございます。\n認証機の追加申請を承認しました。提携店舗ページ（認証機）からご注文ください。',
    machine: (n) => `認証機 ${n}台目`,
    note: 'ご注文の際に請求書が発行されます。お支払い後のキャンセル・返金はできませんので、内容をよくご確認ください。',
    portal: '提携店舗ページ',
    sep: '：',
  },
  en: {
    subject: (code) => `[Yatsuka Station East Exit Parking] Your request for more machines is approved (${code})`,
    intro: 'Thank you for being a partner of Yatsuka Station East Exit Parking.\nYour request for more validation machines has been approved. Please order them on the partner page (Machines).',
    machine: (n) => `Machine ${n}`,
    note: 'The invoice is issued when you order. Paid orders cannot be cancelled or refunded, so please check the details.',
    portal: 'Partner page',
    sep: ': ',
  },
  zh: {
    subject: (code) => `【谷塚站东口共同停车场】追加验证机申请已批准（${code}）`,
    intro: '感谢您一直以来对谷塚站东口共同停车场的支持。\n您的追加验证机申请已获批准。请在合作店铺页面（验证机）订购。',
    machine: (n) => `第${n}台验证机`,
    note: '订购时将开具账单。付款后不能取消或退款，请仔细确认内容。',
    portal: '合作店铺页面',
    sep: '：',
  },
};

/** Email to the partner when the admin approves a request for extra machines.
 *  d.lines: one text per machine (its discount values), d.portalUrl. */
export function requestApprovedMail(lang, d) {
  const t = RQ[lang] || RQ.ja;
  const sign = SIGN[lang] || SIGN.ja;
  const hello = (T[lang] || T.ja).hello(d.name);
  const rows = d.lines.map((l, i) => [t.machine(i + 1), l]);
  const text = [hello, '', t.intro, '', ...rows.map(([k, v]) => `${k}${t.sep}${v}`), '', t.note, `${t.portal}${t.sep}${d.portalUrl}`, '', '――――――――――', ...sign].join('\n');
  const html = `<div style="font-family:sans-serif;font-size:15px;line-height:1.7;color:#1d2733">
<p>${esc(hello)}</p>
<p>${esc(t.intro).replace(/\n/g, '<br>')}</p>
<table style="border-collapse:collapse;margin:12px 0">${rows
    .map(([k, v]) => `<tr><th style="text-align:left;padding:6px 16px 6px 0;color:#5b6472;font-weight:700">${esc(k)}</th><td style="padding:6px 0">${esc(v)}</td></tr>`)
    .join('')}</table>
<p>${esc(t.note)}<br><a href="${esc(d.portalUrl)}">${esc(t.portal)}</a></p>
<p style="color:#5b6472;font-size:13px;border-top:1px solid #e3e7ed;padding-top:8px">${sign.map(esc).join('<br>')}</p>
</div>`;
  return { subject: t.subject(d.code), text, html };
}

const MF = {
  ja: {
    subject: '【谷塚駅東口共同駐車場】二段階認証をリセットしました',
    body: 'ご依頼により、提携店舗ページの二段階認証（認証アプリ）をリセットしました。\n次回ログイン時に、新しいスマートフォンの認証アプリでQRコードを読み取って登録してください。\n\nこの操作に心当たりがない場合は、すぐに当社までご連絡ください。',
    login: 'ログイン',
  },
  en: {
    subject: '[Yatsuka Station East Exit Parking] Your two-step verification has been reset',
    body: 'As requested, we have reset the two-step verification (authenticator app) of your partner page.\nAt your next sign-in, scan the QR code with the authenticator app on your new phone to register it.\n\nIf you did not ask for this, please contact us immediately.',
    login: 'Sign in',
  },
  zh: {
    subject: '【谷塚站东口共同停车场】已重置两步验证',
    body: '根据您的要求，我们已重置合作店铺页面的两步验证（验证器应用）。\n下次登录时，请用新手机上的验证器应用扫描二维码进行登记。\n\n如果您没有提出此要求，请立即与我们联系。',
    login: '登录',
  },
};

/** Email to the partner after the admin reset their two-step verification. */
export function mfaResetMail(lang, d) {
  const t = MF[lang] || MF.ja;
  const sign = SIGN[lang] || SIGN.ja;
  const hello = (T[lang] || T.ja).hello(d.name);
  const text = [hello, '', t.body, '', `${t.login}: ${d.loginUrl}`, '', '――――――――――', ...sign].join('\n');
  const html = `<div style="font-family:sans-serif;font-size:15px;line-height:1.7;color:#1d2733">
<p>${esc(hello)}</p>
<p>${esc(t.body).replace(/\n/g, '<br>')}</p>
<p><a href="${esc(d.loginUrl)}">${esc(t.login)}</a></p>
<p style="color:#5b6472;font-size:13px;border-top:1px solid #e3e7ed;padding-top:8px">${sign.map(esc).join('<br>')}</p>
</div>`;
  return { subject: t.subject, text, html };
}

const MI = {
  ja: {
    subject: (m) => `【谷塚駅東口共同駐車場】${m}分 ご請求書のお知らせ`,
    balanceSubject: (no) => `【谷塚駅東口共同駐車場】不足額のご請求（${no}）`,
    balanceIntro: (no) => `平素より谷塚駅東口共同駐車場をご利用いただき、誠にありがとうございます。\n請求書 ${no} のお支払いに不足がありましたので、不足額のご請求書を発行しました。提携店舗ページのダッシュボードでご確認・PDFのダウンロードができます。`,
    month: (ym) => `${Number(ym.slice(0, 4))}年${Number(ym.slice(5, 7))}月`,
    intro: (m) => `平素より谷塚駅東口共同駐車場をご利用いただき、誠にありがとうございます。\n${m}分の駐車割引認証のご請求書を発行しました。提携店舗ページのダッシュボードでご確認・PDFのダウンロードができます。`,
    rows: { no: '請求書番号', total: 'ご請求金額（税込）', due: 'お支払期限' },
    yen: (n) => `${n}円`,
    bank: 'お振込先：埼玉りそな銀行 草加支店 普通 1534126 カ）スズエ',
    portal: '請求書を見る',
    sep: '：',
  },
  en: {
    subject: (m) => `[Yatsuka Station East Exit Parking] Your invoice for ${m}`,
    balanceSubject: (no) => `[Yatsuka Station East Exit Parking] Invoice for the shortfall on ${no}`,
    balanceIntro: (no) => `Thank you for being a partner of Yatsuka Station East Exit Parking.\nThe payment for invoice ${no} was short, so we have issued an invoice for the shortfall. You can view it and download the PDF on the dashboard of your partner page.`,
    month: (ym) => new Date(`${ym}-01T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', timeZone: 'UTC' }),
    intro: (m) => `Thank you for being a partner of Yatsuka Station East Exit Parking.\nYour invoice for parking validations in ${m} has been issued. You can view it and download the PDF on the dashboard of your partner page.`,
    rows: { no: 'Invoice no.', total: 'Amount (incl. tax)', due: 'Due date' },
    yen: (n) => `¥${n}`,
    bank: 'Bank transfer: Saitama Resona Bank, Soka branch, ordinary 1534126, カ）スズエ',
    portal: 'View invoice',
    sep: ': ',
  },
  zh: {
    subject: (m) => `【谷塚站东口共同停车场】${m}账单通知`,
    balanceSubject: (no) => `【谷塚站东口共同停车场】不足额账单（${no}）`,
    balanceIntro: (no) => `感谢您一直以来对谷塚站东口共同停车场的支持。\n账单 ${no} 的付款金额不足，我们已开具不足额账单。可在合作店铺页面的概览中查看并下载PDF。`,
    month: (ym) => `${Number(ym.slice(0, 4))}年${Number(ym.slice(5, 7))}月`,
    intro: (m) => `感谢您一直以来对谷塚站东口共同停车场的支持。\n已开具${m}的停车优惠验证账单。可在合作店铺页面的概览中查看并下载PDF。`,
    rows: { no: '账单编号', total: '账单金额（含税）', due: '付款期限' },
    yen: (n) => `${n}日元`,
    bank: '汇款账户：埼玉りそな銀行 草加支店 普通 1534126 カ）スズエ',
    portal: '查看账单',
    sep: '：',
  },
};

/** Email to the partner when a monthly invoice has been published. d: { name, month 'YYYY-MM', invoiceNo, total, due, url } */
export function monthlyInvoiceMail(lang, d) {
  const t = MI[lang] || MI.ja;
  const sign = SIGN[lang] || SIGN.ja;
  const hello = (T[lang] || T.ja).hello(d.name);
  // d.month null: a shortfall invoice (不足額のご請求) for d.balanceOf
  const m = d.month ? t.month(d.month) : null;
  const rows = [
    [t.rows.no, d.invoiceNo],
    [t.rows.total, t.yen(Number(d.total).toLocaleString('ja-JP'))],
    [t.rows.due, d.due],
  ];
  const intro = m ? t.intro(m) : t.balanceIntro(d.balanceOf);
  const text = [hello, '', intro, '', ...rows.map(([k, v]) => `${k}${t.sep}${v}`), '', t.bank, '', `${t.portal}${t.sep}${d.url}`, '', '――――――――――', ...sign].join('\n');
  const html = `<div style="font-family:sans-serif;font-size:15px;line-height:1.7;color:#1d2733">
<p>${esc(hello)}</p>
<p>${esc(intro).replace(/\n/g, '<br>')}</p>
<table style="border-collapse:collapse;margin:12px 0">${rows
    .map(([k, v]) => `<tr><th style="text-align:left;padding:6px 16px 6px 0;color:#5b6472;font-weight:700">${esc(k)}</th><td style="padding:6px 0">${esc(v)}</td></tr>`)
    .join('')}</table>
<p>${esc(t.bank)}</p>
<p><a href="${esc(d.url)}">${esc(t.portal)}</a></p>
<p style="color:#5b6472;font-size:13px;border-top:1px solid #e3e7ed;padding-top:8px">${sign.map(esc).join('<br>')}</p>
</div>`;
  return { subject: m ? t.subject(m) : t.balanceSubject(d.balanceOf), text, html };
}

// Overdue reminders (owner, 2026-11-16): 1 day and 7 days after the due date.
const OD = {
  ja: {
    subject: (no, s) => `【谷塚駅東口共同駐車場】${s === 2 ? '【再送】' : ''}お支払いのお願い（${no}）`,
    intro: (s) =>
      s === 2
        ? '平素より谷塚駅東口共同駐車場をご利用いただき、誠にありがとうございます。\n先日もご案内いたしましたが、下記のご請求につきまして、本日時点でまだ未払いの残高がございます。お手数ですが、至急お振込みくださいますようお願い申し上げます。'
        : '平素より谷塚駅東口共同駐車場をご利用いただき、誠にありがとうございます。\n下記のご請求につきまして、お支払期限を過ぎておりますが、本日時点で未払いの残高がございます。お手数ですが、お振込みくださいますようお願い申し上げます。',
    rows: { no: '請求書番号', total: 'ご請求金額（税込）', paid: 'ご入金済み', rest: '未払い残高', due: 'お支払期限' },
    crossed: '本メールと行き違いでお振込みいただいている場合は、ご容赦ください。',
    transfer: (code) => `お振込名義の先頭に提携店舗ID（${code}）を入れてください。`,
  },
  en: {
    subject: (no, s) => `[Yatsuka Station East Exit Parking] ${s === 2 ? 'Second reminder: ' : ''}Payment reminder (${no})`,
    intro: (s) =>
      s === 2
        ? 'Thank you for being a partner of Yatsuka Station East Exit Parking.\nFurther to our earlier reminder, the invoice below still has an outstanding balance. Please make the transfer as soon as possible.'
        : 'Thank you for being a partner of Yatsuka Station East Exit Parking.\nThe due date of the invoice below has passed and there is still an outstanding balance. Please make the transfer at your earliest convenience.',
    rows: { no: 'Invoice no.', total: 'Amount (incl. tax)', paid: 'Received', rest: 'Amount outstanding', due: 'Due date' },
    crossed: 'If your payment has crossed with this email, please disregard it.',
    transfer: (code) => `Please start the transfer name with your partner ID (${code}).`,
  },
  zh: {
    subject: (no, s) => `【谷塚站东口共同停车场】${s === 2 ? '【再次提醒】' : ''}付款提醒（${no}）`,
    intro: (s) =>
      s === 2
        ? '感谢您一直以来对谷塚站东口共同停车场的支持。\n继上次提醒之后，截至今日以下账单仍有未付余额。请尽快汇款。'
        : '感谢您一直以来对谷塚站东口共同停车场的支持。\n以下账单已过付款期限，截至今日仍有未付余额。请您尽快汇款。',
    rows: { no: '账单编号', total: '账单金额（含税）', paid: '已收款', rest: '未付余额', due: '付款期限' },
    crossed: '如您已在本邮件发出前后完成汇款，请忽略本邮件。',
    transfer: (code) => `汇款人名称请以合作店铺ID（${code}）开头。`,
  },
};

/** Reminder to the partner. d: { name, code, invoiceNo, total, paid, rest, due, stage, url } */
export function overdueMail(lang, d) {
  const t = OD[lang] || OD.ja;
  const m = MI[lang] || MI.ja;
  const sign = SIGN[lang] || SIGN.ja;
  const hello = (T[lang] || T.ja).hello(d.name);
  const y = (n) => m.yen(Number(n).toLocaleString('ja-JP'));
  const rows = [
    [t.rows.no, d.invoiceNo],
    [t.rows.total, y(d.total)],
    ...(d.paid > 0 ? [[t.rows.paid, y(d.paid)]] : []),
    [t.rows.rest, y(d.rest)],
    [t.rows.due, d.due],
  ];
  const intro = t.intro(d.stage);
  const after = [m.bank, t.transfer(d.code), '', t.crossed];
  const text = [hello, '', intro, '', ...rows.map(([k, v]) => `${k}${m.sep}${v}`), '', ...after, '', `${m.portal}${m.sep}${d.url}`, '', '――――――――――', ...sign].join('\n');
  const html = `<div style="font-family:sans-serif;font-size:15px;line-height:1.7;color:#1d2733">
<p>${esc(hello)}</p>
<p>${esc(intro).replace(/\n/g, '<br>')}</p>
<table style="border-collapse:collapse;margin:12px 0">${rows
    .map(([k, v]) => `<tr><th style="text-align:left;padding:6px 16px 6px 0;color:#5b6472;font-weight:700">${esc(k)}</th><td style="padding:6px 0">${esc(v)}</td></tr>`)
    .join('')}</table>
<p>${esc(m.bank)}<br>${esc(t.transfer(d.code))}</p>
<p style="color:#5b6472">${esc(t.crossed)}</p>
<p><a href="${esc(d.url)}">${esc(m.portal)}</a></p>
<p style="color:#5b6472;font-size:13px;border-top:1px solid #e3e7ed;padding-top:8px">${sign.map(esc).join('<br>')}</p>
</div>`;
  return { subject: t.subject(d.invoiceNo, d.stage), text, html };
}

/** Daily list of overdue invoices for 鈴江 (Japanese). d: { today, rows: [{ code, name, no, due, late, rest, sent }], url } */
export function overdueListMail(d) {
  const total = d.rows.reduce((s, r) => s + r.rest, 0);
  const yen = (n) => `${Number(n).toLocaleString('ja-JP')}円`;
  const head = ['提携店舗', '請求書番号', 'お支払期限', '経過日数', '未払い残高', '本日の督促'];
  const cells = (r) => [`${r.code} ${r.name || ''}`, r.no, r.due, `${r.late}日`, yen(r.rest), r.sent || '—'];
  const subject = `【管理】支払期限超過の請求書 ${d.rows.length}件（${d.today}）`;
  const text = [
    `${d.today} 時点で、お支払期限を過ぎた未払いの請求書が ${d.rows.length}件 あります（未払い残高 合計 ${yen(total)}）。`,
    '',
    ...d.rows.map((r) => cells(r).join(' / ')),
    '',
    `請求書一覧：${d.url}`,
  ].join('\n');
  const html = `<div style="font-family:sans-serif;font-size:14px;line-height:1.6;color:#1d2733">
<p>${esc(d.today)} 時点で、お支払期限を過ぎた未払いの請求書が <b>${d.rows.length}件</b> あります（未払い残高 合計 <b>${esc(yen(total))}</b>）。</p>
<table style="border-collapse:collapse"><tr>${head.map((h) => `<th style="text-align:left;padding:6px 12px 6px 0;color:#5b6472;border-bottom:2px solid #0b3a6e">${esc(h)}</th>`).join('')}</tr>
${d.rows.map((r) => `<tr>${cells(r).map((c, i) => `<td style="padding:6px 12px 6px 0;border-bottom:1px solid #e3e7ed;${i >= 3 && i <= 4 ? 'text-align:right' : ''}">${esc(c)}</td>`).join('')}</tr>`).join('\n')}
</table>
<p><a href="${esc(d.url)}">請求書一覧を開く</a></p>
</div>`;
  return { subject, text, html };
}
