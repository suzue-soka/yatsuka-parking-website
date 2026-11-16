// Downloadable PDF of an invoice (適格請求書), A4 portrait. Always in Japanese
// (owner's decision 2026-11-15), whatever language the viewer uses on the site.
// Same content as the printable page /portal/invoices/[id].
import { onbText } from '@/lib/content/onboarding';
import { yen, periodRange } from '@/lib/dates';
import { startDoc, itemTable, NAVY, GREY, INK, PALE, WHITE } from '@/lib/pdf/base';

/**
 * @param inv     invoice row with invoice_lines[] and partners{}
 * @param assets  { font, logo, fontkit }
 */
export async function invoicePdf(inv, assets, lang = 'ja', orig = null) {
  const I = onbText(lang).invoice;
  const transferName = onbText(lang).billing.transferName;
  const sep = lang === 'ja' ? '：' : ': ';
  const p = inv.partners || {};
  const Y = (n) => (lang === 'ja' ? `${yen(n)}円` : `¥${yen(n)}`);

  const isCn = inv.kind === 'cancellation';
  const title = isCn ? I.cnTitle : I.title;
  const d = await startDoc(assets, { title: `${title} ${inv.invoice_no}`, author: I.issuer });
  const { page, text, wrap, width, M, W, right } = d;
  let y = d.top;

  // Title (+ 領収済み when paid) and numbers on the right
  text(title, M, y, 26, NAVY);
  const stamp = inv.status === 'cancelled' ? I.cancelledStamp : !isCn && inv.status === 'paid' ? I.receipt : null;
  if (stamp) {
    const x = M + width(title, 26) + 14;
    const w = width(stamp, 11) + 16;
    page.drawRectangle({ x, y: y + 2, width: w, height: 20, borderColor: NAVY, borderWidth: 1.2, color: WHITE });
    text(stamp, x + 8, y + 7, 11, NAVY);
  }
  let ry = y + 14;
  for (const [k, v] of [
    [I.no, inv.invoice_no],
    [I.issued, inv.issued_on || '—'],
    [I.due, inv.due_on || '—'],
  ]) {
    text(`${k}${sep}${v}`, right, ry, 10, INK, 'right');
    ry -= 15;
  }
  y -= 40;

  y = partyBlocks(d, y, p, I, sep);

  // Billed period, clearly above the total (monthly invoices)
  if (inv.period_month) {
    text(I.periodLine(inv.period_month, periodRange(inv.period_month)), M, y, 13, NAVY);
    y -= 40;
  }

  // Total
  page.drawRectangle({ x: M, y: y - 14, width: W - 2 * M, height: 40, color: PALE });
  text(I.total, M + 12, y, 13, NAVY);
  text(Y(inv.total_yen), right - 12, y - 2, 22, NAVY, 'right');
  y -= 50;

  y = itemTable(d, y, I.th, inv.invoice_lines || [], Y);
  y -= 4;
  // Carried differences (前回分の不足額・過入金) are outside the 10% tax base.
  const adj = inv.adjust_yen || 0;
  if (inv.total_yen - adj !== 0) text(I.taxLine(Y(inv.total_yen - adj), Y(inv.tax_yen)), right, y, 10, INK, 'right');
  if (adj !== 0) {
    if (inv.total_yen - adj !== 0) y -= 14;
    text(I.exemptLine(Y(adj)), right, y, 10, INK, 'right');
  }
  y -= 34;

  if (isCn || inv.status === 'cancelled') {
    if (isCn) {
      for (const l of wrap(I.cancels(orig?.invoice_no || '—', orig?.issued_on || '—'), 10.5, W - 2 * M)) {
        text(l, M, y, 10.5);
        y -= 16;
      }
    }
    text(I.issuer, W / 2, 30, 8, GREY, 'center');
    return d.doc.save();
  }
  // お振込先: easy to find — pale box with a navy bar, larger navy text
  const bank = wrap(I.bank, 12, W - 2 * M - 24);
  const boxH = bank.length * 17 + 14;
  page.drawRectangle({ x: M, y: y - boxH + 19, width: W - 2 * M, height: boxH, color: PALE });
  page.drawRectangle({ x: M, y: y - boxH + 19, width: 3, height: boxH, color: NAVY });
  for (const l of bank) {
    text(l, M + 14, y, 12, NAVY);
    y -= 17;
  }
  y -= 14;
  for (const l of wrap(transferName(p.partner_code || ''), 10, W - 2 * M)) {
    text(l, M, y, 10, GREY);
    y -= 15;
  }

  text(I.issuer, W / 2, 30, 8, GREY, 'center');
  return d.doc.save();
}

/** Billed-to block (left) and issuer block (right). Returns the y below both. */
export function partyBlocks(d, y, p, I, sep) {
  const { text, wrap, page, M, W, right } = d;
  const leftW = W / 2 - M;
  let ly = y;
  for (const l of wrap(I.to(p.billing_name || p.name || ''), 15, leftW)) {
    text(l, M, ly, 15);
    ly -= 20;
  }
  page.drawLine({ start: { x: M, y: ly + 14 }, end: { x: M + leftW, y: ly + 14 }, thickness: 0.8, color: INK });
  ly -= 4;
  for (const l of wrap(p.billing_address || p.address || '', 10, leftW)) {
    text(l, M, ly, 10, GREY);
    ly -= 14;
  }
  text(`${I.partnerId}${sep}${p.partner_code || ''}`, M, ly, 10, GREY);
  ly -= 14;

  let ry = y;
  for (const [s, size, color] of [
    [I.issuer, 12, INK],
    [I.issuerAddress, 10, GREY],
    ['TEL 048-924-2401', 10, GREY],
    [I.regNo, 10, GREY],
  ]) {
    text(s, right, ry, size, color, 'right');
    ry -= size + 5;
  }
  return Math.min(ly, ry) - 22;
}
