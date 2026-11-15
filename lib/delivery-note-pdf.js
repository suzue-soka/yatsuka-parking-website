// 納品書 (delivery note) for a shipped validation machine, A4 portrait, Japanese.
// Printed and put (unsealed) in the parcel; also downloadable from the partner page.
// Never marked 代済 / 支払済: that would make it a receipt subject to stamp duty.
import { onbText } from '@/lib/content/onboarding';
import { carrierFor } from '@/lib/carriers';
import { yen } from '@/lib/dates';
import { startDoc, itemTable, NAVY, GREY, INK, PALE } from '@/lib/pdf/base';
import { partyBlocks } from '@/lib/invoice-pdf';

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
  warranty: '保証期間：お届け日から1年間（保証の内容はメーカーの保証規定に準じます）',
  contact:
    '内容物の不足や破損などがございましたら、お手数ですが株式会社鈴江（TEL 048-924-2401）または提携店舗ページの「お問い合わせ」からご連絡ください。',
};

/**
 * @param m       machine row with invoices{ invoice_no, total_yen, tax_yen, invoice_lines[] } and partners{}
 * @param assets  { font, logo, fontkit }
 */
export async function deliveryNotePdf(m, assets) {
  const I = onbText('ja').invoice;
  const sep = '：';
  const p = m.partners || {};
  const inv = m.invoices || null;
  const Y = (n) => `${yen(n)}円`;

  const d = await startDoc(assets, { title: `${DN.title} ${m.delivery_note_no || ''}`, author: I.issuer });
  const { page, text, wrap, M, W, right } = d;
  let y = d.top;

  text(DN.title, M, y, 26, NAVY);
  let ry = y + 14;
  for (const [k, v] of [
    [DN.no, m.delivery_note_no || '—'],
    [DN.issued, m.shipped_on || '—'],
  ]) {
    text(`${k}${sep}${v}`, right, ry, 10, INK, 'right');
    ry -= 15;
  }
  y -= 40;

  y = partyBlocks(d, y, p, I, sep);

  for (const l of wrap(DN.intro, 10.5, W - 2 * M)) {
    text(l, M, y, 10.5);
    y -= 16;
  }
  y -= 8;

  // Total
  if (inv) {
    page.drawRectangle({ x: M, y: y - 14, width: W - 2 * M, height: 40, color: PALE });
    text(DN.total, M + 12, y, 13, NAVY);
    text(Y(inv.total_yen), right - 12, y - 2, 22, NAVY, 'right');
    y -= 50;
  }

  // Items: the lines of the machine invoice; the serial number under the first one
  const rows = (inv?.invoice_lines?.length ? inv.invoice_lines : [{ description: m.model, quantity: 1, unit_yen: null, amount_yen: null }]).map(
    (r, i) => (i === 0 ? { ...r, sub: [DN.serial(m.serial_no)] } : r),
  );
  y = itemTable(d, y, I.th, rows, Y);
  if (inv) {
    y -= 4;
    text(I.taxLine(Y(inv.total_yen), Y(inv.tax_yen)), right, y, 10, INK, 'right');
    y -= 30;
  } else y -= 16;

  // Shipment details
  const carrier = carrierFor(m.carrier);
  const values = {
    invoice: inv?.invoice_no || '—',
    shipped: m.shipped_on || '—',
    carrier: carrier ? carrier.ja : m.carrier || '—',
    tracking: m.tracking_no || '—',
  };
  for (const [key, label] of DN.details) {
    text(label, M + 4, y, 10, GREY);
    text(values[key], M + 110, y, 10.5);
    y -= 17;
  }
  y -= 12;
  for (const l of wrap(DN.warranty, 10.5, W - 2 * M)) {
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
