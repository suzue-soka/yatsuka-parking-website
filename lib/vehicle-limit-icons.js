// Pictograms for the vehicle limits, the same drawings as on the entrance sign
// (design canvas 「看板デザイン（当社案）」, tile row 「ご利用いただけない車両」).
const open = '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
const side = '<path d="M3 16.5v-3.2l2.2-.8 1.8-3.5h7.5l2.5 3.5 3 .9v3.1z"></path><circle cx="7.5" cy="17" r="1.7" fill="#003870"></circle><circle cx="16.5" cy="17" r="1.7" fill="#003870"></circle>';
const front = '<path d="M7.6 8.2l1.2-3.4h6.4l1.2 3.4"></path><rect x="5.5" y="8.2" width="13" height="5.8" rx="1.6"></rect><path d="M7.5 14v2M16.5 14v2M8 11h1.2M14.8 11H16"></path>';

const ICONS = {
  length: `${open}<g transform="translate(0 -2)">${side}</g><path d="M3 21h18M4.5 19.6L3 21l1.5 1.4M19.5 19.6L21 21l-1.5 1.4" stroke="#f27420"></path></svg>`,
  width: `${open}<g>${front}</g><path d="M4 20.5h16M5.5 19.1L4 20.5l1.5 1.4M18.5 19.1L20 20.5l-1.5 1.4" stroke="#f27420"></path></svg>`,
  height: `${open}<g transform="translate(-1.2 1.6) scale(.82)">${side}</g><path d="M20.5 3v17M19.1 4.5L20.5 3l1.4 1.5M19.1 18.5l1.4 1.5 1.4-1.5" stroke="#f27420"></path></svg>`,
  clearance: `${open}<g transform="translate(0 -5)">${side}</g><path d="M2 21h20"></path><path d="M12 13.4v6.2M10.7 14.7L12 13.4l1.3 1.3M10.7 18.3L12 19.6l1.3-1.3" stroke="#f27420"></path></svg>`,
  load: `${open}<g transform="translate(0 2.5)">${side}</g><path d="M9 2.5h6l1.6 6h-9.2z" stroke="#f27420"></path><text x="12" y="7.4" font-size="4.6" font-weight="700" text-anchor="middle" fill="#f27420" stroke="none" font-family="Inter, Arial, sans-serif">t</text></svg>`,
};

export const vehicleLimitIconSvg = (key) => ICONS[key] || '';
