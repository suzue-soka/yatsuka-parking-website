// 認証機 設定依頼書: what 鈴江 sends Amano so the machines are configured (machine ID, 店No., discount).
// Same document style as 請求書 / 納品書. Japanese, A4.
import { DISCOUNT_TYPES } from '@/lib/program-data';
import { yen } from '@/lib/dates';
import { startDoc, NAVY, GREY, INK } from '@/lib/pdf/base';

const ISSUER = ['株式会社鈴江', '埼玉県草加市瀬崎1-7-20', 'TEL 048-924-2401'];

/**
 * @param r { date, partner: { partner_code, name, address }, machines: [{ machine_code, discount_codes[], store_nos[] }] }
 */
export async function setupRequestPdf(r, assets) {
  const d = await startDoc(assets, { title: `認証機 設定依頼書 ${r.partner.partner_code}`, author: ISSUER[0] });
  const { page, text, wrap, hr, M, W, right } = d;
  let y = d.top;

  text('認証機 設定依頼書', M, y, 26, NAVY);
  text(`依頼日：${r.date}`, right, y + 14, 10, INK, 'right');
  y -= 40;

  text('ご担当者様', M, y, 15);
  page.drawLine({ start: { x: M, y: y - 6 }, end: { x: M + 200, y: y - 6 }, thickness: 0.8, color: INK });
  let ry = y;
  ISSUER.forEach((s, i) => {
    text(s, right, ry, i ? 10 : 12, i ? GREY : INK, 'right');
    ry -= i ? 15 : 17;
  });
  y = Math.min(y - 24, ry) - 16;

  for (const l of wrap('下記の認証機（省スペース型QRコード割引券発行機）の設定をお願いいたします。', 10.5, W - 2 * M)) {
    text(l, M, y, 10.5);
    y -= 16;
  }
  y -= 24;

  // The partner's name and address are not sent to Amano (owner, 2026-11-15).

  // Machines
  const xNo = M + 120;
  const xDisc = M + 200;
  text('機械ID', M + 4, y, 10, GREY);
  text('店No.', xNo, y, 10, GREY);
  text('認証値（割引）', xDisc, y, 10, GREY);
  y -= 8;
  hr(y, NAVY, 1);
  y -= 18;
  for (const m of r.machines) {
    const codes = m.discount_codes || [];
    codes.forEach((code, i) => {
      const t = DISCOUNT_TYPES.find((x) => x.code === code);
      if (i === 0) text(m.machine_code || '—', M + 4, y, 11);
      text(String((m.store_nos || [])[i] ?? '—'), xNo, y, 11);
      text(t ? `${yen(t.yen)}円（${t.hours}時間無料）` : code, xDisc, y, 11);
      y -= 17;
    });
    y -= 2;
    hr(y + 8);
    y -= 8;
  }
  y -= 6;
  text(`合計 ${r.machines.length}台`, right, y, 10, INK, 'right');
  y -= 34;

  for (const l of wrap(
    '設定完了後、認証機は当社（株式会社鈴江）宛にご納品ください。機械IDは当社の管理番号です。ご不明な点は上記までご連絡ください。',
    9.5,
    W - 2 * M,
  )) {
    text(l, M, y, 9.5, GREY);
    y -= 14;
  }

  text(ISSUER[0], W / 2, 30, 8, GREY, 'center');
  return d.doc.save();
}
