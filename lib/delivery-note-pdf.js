// 納品書 (delivery note) for a shipped validation machine, A4 portrait, Japanese.
// Printed and put (unsealed) in the parcel; also downloadable from the partner page.
// Never marked 代済 / 支払済: that would make it a receipt subject to stamp duty.
import { onbText } from '@/lib/content/onboarding';
import { carrierFor } from '@/lib/carriers';
import { yen } from '@/lib/dates';
import { DISCOUNT_TYPES } from '@/lib/program-data';
import { startDoc, itemTable, NAVY, GREY, INK, PALE } from '@/lib/pdf/base';
import { partyBlocks, drawSeal } from '@/lib/invoice-pdf';

const DN = {
  title: '納品書',
  no: '納品書番号',
  issued: '発行日',
  intro: '下記のとおり納品いたします。お届けの際は、内容物と製造番号をご確認ください。',
  total: '合計金額（税込）',
  serial: (s) => `製造番号：${s || '—'}`,
  details: [
    ['invoice', 'ご請求書番号'],
    ['shipped', '発送日'],
    ['carrier', '配送業者'],
    ['tracking', '伝票番号'],
  ],
  warranty: (until) => `保証期限：${until || '—'}（当社がメーカーから納品を受けた日から1年間。保証の内容はメーカーの保証規定に準じます）`,
  contact:
    '内容物の不足や破損などがございましたら、お手数ですが株式会社鈴江（TEL 048-924-2401）または提携店舗ページの「お問い合わせ」からご連絡ください。',
};

/**
 * @param g       one shipment: { delivery_note_no, shipped_on, carrier, tracking_no, warranty_until, partners{},
 *                  machines: [{ machine_code, model, serial_no, discount_codes[], store_nos[], unit_yen }], invoice_nos[] }
 * @param assets  { font, logo, fontkit }
 */
export async function deliveryNotePdf(g, assets) {
  const I = onbText('ja').invoice;
  const sep = '：';
  const p = g.partners || {};
  const Y = (n) => `${yen(n)}円`;
  const hours = (code) => DISCOUNT_TYPES.find((d) => d.code === code)?.hours;

  const d = await startDoc(assets, { title: `${DN.title} ${g.delivery_note_no || ''}`, author: I.issuer });
  const { page, text, wrap, M, W, right } = d;
  let y = d.top;

  text(DN.title, M, y, 26, NAVY);
  let ry = y + 14;
  for (const [k, v] of [
    [DN.no, g.delivery_note_no || '—'],
    [DN.issued, g.shipped_on || '—'],
  ]) {
    text(`${k}${sep}${v}`, right, ry, 10, INK, 'right');
    ry -= 15;
  }
  y -= 40;

  const sealTop = y;
  y = partyBlocks(d, y, p, I, sep);
  await drawSeal(d, assets, sealTop); // company seal, as on the invoice (owner, 2026-11-16)

  for (const l of wrap(DN.intro, 10.5, W - 2 * M)) {
    text(l, M, y, 10.5);
    y -= 16;
  }
  y -= 30; // the total box reaches 26 pt above its baseline

  // One row per machine: price from its machine invoice, then machine ID, serial number and discounts
  const priced = g.machines.every((m) => m.unit_yen != null);
  const total = priced ? g.machines.reduce((sum, m) => sum + m.unit_yen, 0) : null;
  if (priced) {
    page.drawRectangle({ x: M, y: y - 14, width: W - 2 * M, height: 40, color: PALE });
    text(DN.total, M + 12, y, 13, NAVY);
    text(Y(total), right - 12, y - 2, 22, NAVY, 'right');
    y -= 50;
  }
  const rows = g.machines.map((m) => ({
    description: m.model,
    quantity: 1,
    unit_yen: m.unit_yen,
    amount_yen: m.unit_yen,
    sub: [
      `機械ID：${m.machine_code || '—'}　${DN.serial(m.serial_no)}`,
      `割引：${(m.discount_codes || [])
        .map((code, i) => `店No.${(m.store_nos || [])[i] ?? '—'} ${hours(code) ? `${hours(code)}時間無料` : code}`)
        .join('、')}`,
    ],
  }));
  y = itemTable(d, y, I.th, rows, Y);
  if (priced) {
    y -= 4;
    text(I.taxLine(Y(total), Y(Math.floor((total * 10) / 110))), right, y, 10, INK, 'right');
    y -= 30;
  } else y -= 16;

  // Shipment details
  const carrier = carrierFor(g.carrier);
  const values = {
    invoice: (g.invoice_nos || []).join('、') || '—',
    shipped: g.shipped_on || '—',
    carrier: carrier ? carrier.ja : g.carrier || '—',
    tracking: g.tracking_no || '—',
  };
  for (const [key, label] of DN.details) {
    text(label, M + 4, y, 10, GREY);
    text(values[key], M + 110, y, 10.5);
    y -= 17;
  }
  y -= 12;
  for (const l of wrap(DN.warranty(g.warranty_until), 10.5, W - 2 * M)) {
    text(l, M, y, 10.5, NAVY);
    y -= 16;
  }
  y -= 6;
  for (const l of wrap(DN.contact, 9.5, W - 2 * M)) {
    text(l, M, y, 9.5, GREY);
    y -= 14;
  }

  text(I.issuer, W / 2, 30, 8, GREY, 'center');
  return d.doc.save();
}
