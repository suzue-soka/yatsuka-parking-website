// Shared drawing helpers for the site's A4 business documents (請求書, 納品書).
// Font: IPAゴシック (IPA Font License v1.0, assets/fonts), embedded as a subset.
import { PDFDocument, rgb } from 'pdf-lib';

export const NAVY = rgb(0, 0.22, 0.439); // #003870 (same as --navy)
export const GREY = rgb(0.357, 0.392, 0.447); // #5B6472
export const LINE = rgb(0.89, 0.906, 0.929); // #E3E7ED
export const INK = rgb(0.114, 0.153, 0.2);
export const PALE = rgb(0.953, 0.961, 0.973);
export const WHITE = rgb(1, 1, 1);

const A4 = [595.28, 841.89];
const M = 48; // page margin
// Japanese can break between any two characters, English between words.
const TOKEN = /\n|[　-鿿＀-￯]|[^\s　-鿿＀-￯]+\s*|\s+/g;

/**
 * New one-page A4 document with the letterhead drawn.
 * @param assets { font, logo, fontkit } — without fontkit a standard font is used (tests only, ASCII).
 */
export async function startDoc(assets, { title, author }) {
  const doc = await PDFDocument.create();
  doc.setTitle(title);
  doc.setAuthor(author);
  let font;
  if (assets.fontkit) {
    doc.registerFontkit(assets.fontkit);
    font = await doc.embedFont(assets.font, { subset: true });
  } else {
    font = await doc.embedFont(assets.standardFont);
  }
  let page = doc.addPage(A4);
  const W = A4[0];
  const right = W - M;

  const safe = (s) => (assets.fontkit ? String(s ?? '') : String(s ?? '').replace(/[^\x20-\x7E]/g, '?'));
  const width = (s, size) => font.widthOfTextAtSize(safe(s), size);
  const text = (s, x, y, size, color = INK, align = 'left') => {
    const str = safe(s);
    const w = font.widthOfTextAtSize(str, size);
    const xx = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
    page.drawText(str, { x: xx, y, size, font, color });
    return w;
  };
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
  const hr = (y, color = LINE, thickness = 1, x1 = M, x2 = right) =>
    page.drawLine({ start: { x: x1, y }, end: { x: x2, y }, thickness, color });

  // Letterhead: logo and a thin rule
  let y = A4[1] - M;
  if (assets.logo) {
    const img = await doc.embedPng(assets.logo);
    // Level lockup at 2/3 of the old height, its bottom on the same line as before.
    const h = 23;
    page.drawImage(img, { x: M, y: y - 34, width: (img.width / img.height) * h, height: h });
  }
  y -= 46;
  hr(y);
  y -= 34;

  const top = y;
  // Continue on a new page (long lists); returns the y to continue from.
  const newPage = () => {
    page = doc.addPage(A4);
    return A4[1] - M - 10;
  };
  return {
    doc,
    get page() {
      return page;
    },
    font, W, M, right, top, text, wrap, width, hr, newPage,
  };
}

/** Item table (品目 | 数量 | 単価 | 金額). Returns the y below the table. */
export function itemTable(d, y, th, rows, money) {
  const { text, wrap, hr, M, right } = d;
  const xQty = right - 220;
  const xUnit = right - 100;
  text(th[0], M + 4, y, 10, GREY);
  text(th[1], xQty, y, 10, GREY, 'right');
  text(th[2], xUnit, y, 10, GREY, 'right');
  text(th[3], right - 4, y, 10, GREY, 'right');
  y -= 8;
  hr(y, NAVY, 1);
  y -= 18;
  for (const r of rows) {
    text(String(r.quantity ?? ''), xQty, y, 10.5, INK, 'right');
    text(r.unit_yen == null ? '—' : money(r.unit_yen), xUnit, y, 10.5, INK, 'right');
    text(r.amount_yen == null ? '—' : money(r.amount_yen), right - 4, y, 10.5, INK, 'right');
    for (const line of wrap(r.description, 10.5, xQty - M - 60)) {
      text(line, M + 4, y, 10.5);
      y -= 15;
    }
    for (const sub of r.sub || []) {
      text(sub, M + 14, y, 9.5, GREY);
      y -= 14;
    }
    y -= 4;
    hr(y + 8);
    y -= 8;
  }
  return y;
}
