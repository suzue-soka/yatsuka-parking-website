// Pictograms for the four partner benefits (提携店舗を募集しています). Original drawings for this
// site, same 24 × 24 grid as the facility icons but inverted for the navy band: navy lines on a
// white tile, one orange accent per icon. Static markup only — never put user input in here.
const O = '#f27420';

export const PARTNER_ICONS = {
  // 集客・来店促進: a shopfront with its door open
  visit: `<path d="M3.5 9.5l1.6-5h13.8l1.6 5a2.15 2.15 0 0 1-4.25 0 2.15 2.15 0 0 1-4.25 0 2.15 2.15 0 0 1-4.25 0 2.15 2.15 0 0 1-4.25 0z"/><path d="M5 12v8h14v-8"/><path d="M10 20v-4.6h4V20" stroke="${O}"/>`,
  // 利用状況をいつでも確認: daily counts as bars with a trend line
  usage: `<path d="M4 4v16h16"/><path d="M8 17v-3M12 17v-5.5M16 17v-8"/><path d="M7 10l4-3 2.6 1.8L18 4.6" stroke="${O}"/>`,
  // 請求書をオンラインで: a document with a yen mark
  invoice: `<path d="M6 3h8.5L19 7.5V21H6z"/><path d="M14.5 3v4.5H19"/><path d="M9.8 10.2l2.2 3 2.2-3M12 13.2v3.4M10.2 14.6h3.6" stroke="${O}"/><path d="M9 19h6"/>`,
  // 認証機の導入も簡単: the two-button ticket machine printing a QR discount ticket
  machine: `<rect x="3.5" y="3.5" width="17" height="9.5" rx="2"/><circle cx="7.4" cy="7.2" r="1.05"/><circle cx="10.8" cy="7.2" r="1.05"/><path d="M7 10.4h10"/><path d="M7.5 13v7.5h9V13"/><path d="M10.2 15.6h1v1h-1zM13 15.6h1v1h-1zM10.2 18h1v1h-1z" stroke="${O}" stroke-width="1.3"/><path d="M13.3 18.5h.6" stroke="${O}"/>`,
};

/** Full <svg> markup of one icon (navy 1.7px lines, round joins). */
export const partnerIconSvg = (key) =>
  `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#003870" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PARTNER_ICONS[key] || ''}</svg>`;
