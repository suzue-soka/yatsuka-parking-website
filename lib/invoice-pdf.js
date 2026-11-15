// Builds the downloadable PDF of an invoice (適格請求書), A4 portrait, in Japanese or English
// (Chinese viewers get Japanese: the font has no simplified-Chinese glyphs).
// Same content as the printable page /portal/invoices/[id]. Font: IPAゴシック (IPA Font License v1.0,
// assets/fonts), embedded as a subset so the file stays small.
import { PDFDocument, rgb } from 'pdf-lib';
import { onbText } from '@/lib/content/onboarding';
import { yen } from '@/lib/dates';

const NAVY = rgb(0.043, 0.227, 0.431); // #0B3A6E
const GREY = rgb(0.357, 0.392, 0.447); // #5B6472
const LINE = rgb(0.89, 0.906, 0.929); // #E3E7ED
const INK = rgb(0.114, 0.153, 0.2);

const A4 = [595.28, 841.89];
const M = 48; // page margin

/**
 * @param inv     invoice row with invoice_lines[] and partners{}
 * @param assets  { font: Uint8Array, logo: Uint8Array|null, fontkit, standardFont? }
 */
export async function invoicePdf(inv, assets, viewerLang = 'ja') {
  const lang = viewerLang === 'en' ? 'en' : 'ja';
  const I = onbText(lang).invoice;
  const transferName = onbText(lang).billing.transferName;
  const sep = lang === 'ja' ? '：' : ': ';
  const p = inv.partners || {};
  const lines = inv.invoice_lines || [];
  const Y = (n) => (lang === 'ja' ? `${yen(n)}円` : `¥${yen(n)}`);

  const doc = await PDFDocument.create();
  doc.setTitle(`${I.title} ${inv.invoice_no}`);
  doc.setAuthor(I.issuer);
  let font;
  if (assets.fontkit) {
    doc.registerFontkit(assets.fontkit);
    font = await doc.embedFont(assets.font, { subset: true });
  } else {
    font = await doc.embedFont(assets.standardFont); // tests only (no Japanese)
  }
  const page = doc.addPage(A4);
  const W = A4[0];
  let y = A4[1] - M;

  // Test mode (standard font) can only draw plain ASCII.
  const safe = (s) => (assets.fontkit ? String(s ?? '') : String(s ?? '').replace(/[^\x20-\x7E]/g, '?'));
  const text = (s, x, yy, size, color = INK, align = 'left') => {
    const str = safe(s);
    const w = font.widthOfTextAtSize(str, size);
    const xx = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
    page.drawText(str, { x: xx, y: yy, size, font, color });
    return w;
  };
  // Wrap to a width: Japanese can break between any two characters, English between words.
  const TOKEN = /\n|[\u3000-\u9fff\uff00-\uffef]|[^\s\u3000-\u9fff\uff00-\uffef]+\s*|\s+/g;
  const wrap = (s, size, maxW) => {
    const out = [];
    let cur = '';
    for (const tok of safe(s).match(TOKEN) || []) {
      if (tok === '\n') {
        out.push(cur.trimEnd());
        cur = '';
        continue;
      }
      if (cur && font.widthOfTextAtSize((cur + tok).trimEnd(), size) > maxW) {
        out.push(cur.trimEnd());
        cur = tok.trimStart();
      } else cur += tok;
    }
    out.push(cur.trimEnd());
    return out;
  };
  const hr = (yy, color = LINE, thickness = 1) =>
    page.drawLine({ start: { x: M, y: yy }, end: { x: W - M, y: yy }, thickness, color });

  // Letterhead
  if (assets.logo) {
    const img = await doc.embedPng(assets.logo);
    const h = 34;
    page.drawImage(img, { x: M, y: y - h, width: (img.width / img.height) * h, height: h });
  }
  y -= 46;
  hr(y);
  y -= 34;

  // Title (+ 領収済み when paid) and invoice numbers on the right
  text(I.title, M, y, 26, NAVY);
  if (inv.status === 'paid') {
    const x = M + font.widthOfTextAtSize(safe(I.title), 26) + 14;
    const w = font.widthOfTextAtSize(safe(I.receipt), 11) + 16;
    page.drawRectangle({ x, y: y + 2, width: w, height: 20, borderColor: NAVY, borderWidth: 1.2, color: rgb(1, 1, 1) });
    text(I.receipt, x + 8, y + 7, 11, NAVY);
  }
  const right = W - M;
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

  // Billed to (left) and issuer (right)
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

  ry = y;
  for (const [s, size, color] of [
    [I.issuer, 12, INK],
    [I.issuerAddress, 10, GREY],
    ['TEL 048-924-2401', 10, GREY],
    [I.regNo, 10, GREY],
  ]) {
    text(s, right, ry, size, color, 'right');
    ry -= size + 5;
  }
  y = Math.min(ly, ry) - 22;

  // Total
  page.drawRectangle({ x: M, y: y - 14, width: W - 2 * M, height: 40, color: rgb(0.953, 0.961, 0.973) });
  text(I.total, M + 12, y, 13, NAVY);
  text(Y(inv.total_yen), right - 12, y - 2, 22, NAVY, 'right');
  y -= 50;

  // Lines
  const cols = [M, W - M - 250, W - M - 160, W - M]; // description | qty | unit | amount (right edges)
  text(I.th[0], M + 4, y, 10, GREY);
  text(I.th[1], cols[1] + 30, y, 10, GREY, 'right');
  text(I.th[2], cols[2] + 70, y, 10, GREY, 'right');
  text(I.th[3], cols[3] - 4, y, 10, GREY, 'right');
  y -= 8;
  hr(y, NAVY, 1);
  y -= 18;
  for (const l of lines) {
    const desc = wrap(l.description, 10.5, cols[1] - M - 40);
    text(String(l.quantity), cols[1] + 30, y, 10.5, INK, 'right');
    text(Y(l.unit_yen), cols[2] + 70, y, 10.5, INK, 'right');
    text(Y(l.amount_yen), cols[3] - 4, y, 10.5, INK, 'right');
    for (const d of desc) {
      text(d, M + 4, y, 10.5);
      y -= 15;
    }
    y -= 4;
    hr(y + 8);
    y -= 8;
  }
  y -= 4;
  text(I.taxLine(Y(inv.total_yen), Y(inv.tax_yen)), right, y, 10, INK, 'right');
  y -= 34;

  // Payment
  for (const l of wrap(I.bank, 10, W - 2 * M)) {
    text(l, M, y, 10);
    y -= 15;
  }
  for (const l of wrap(transferName(p.partner_code || ''), 10, W - 2 * M)) {
    text(l, M, y, 10, GREY);
    y -= 15;
  }

  // Footer
  text(I.issuer, W / 2, 30, 8, GREY, 'center');

  return doc.save();
}
