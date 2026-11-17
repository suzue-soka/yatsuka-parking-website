// Facility pictograms (施設のご案内). Original drawings for this site: 24 × 24 grid, white lines on a
// navy tile, one orange accent per icon. Static markup only — never put user input in here.
const O = '#f27420';
const T = (x, y, size, s, fill = '#fff') =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="700" text-anchor="middle" fill="${fill}" stroke="none" font-family="Inter, Arial, sans-serif">${s}</text>`;
const CAR = '<path d="M3 16.5v-3.2l2.2-.8 1.8-3.5h7.5l2.5 3.5 3 .9v3.1z"/><circle cx="7.5" cy="17" r="1.7" fill="#003870"/><circle cx="16.5" cy="17" r="1.7" fill="#003870"/>';
const CHAIR = '<circle cx="10" cy="4.6" r="1.6" fill="#fff" stroke="none"/><path d="M10 7.6v6h5l2.4 5"/><path d="M10 10.2h4"/><path d="M8 12.4a5 5 0 1 0 6.4 6.1"/>';

export const FACILITY_ICONS = {
  h24: `<path d="M12 3a9 9 0 1 1-9 9"/><path d="M3 12a9 9 0 0 1 9-9" stroke="${O}" stroke-dasharray="1.2 2.6"/>${T(12, 15.2, 8.5, '24')}`,
  capacity: `<rect x="3.5" y="3.5" width="17" height="17" rx="3"/>${T(12, 14.6, 10.5, 'P')}<path d="M7.5 17.6h9" stroke="${O}"/>`,
  station: `<rect x="6" y="3" width="12" height="13" rx="3"/><path d="M6 9h12"/><circle cx="9.2" cy="12.6" r="1" fill="${O}" stroke="none"/><circle cx="14.8" cy="12.6" r="1" fill="${O}" stroke="none"/><path d="M8.8 16l-2.2 4.5M15.2 16l2.2 4.5"/>`,
  monthly: `<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8.5 3v4M15.5 3v4"/>${T(12, 17.8, 6.6, '月', O)}`,
  security: `<path d="M12 3l7 2.5V11c0 4.5-3 8-7 10-4-2-7-5.5-7-10V5.5z"/><path d="M8.8 12l2.3 2.3 4.1-4.6" stroke="${O}"/>`,
  max: `${T(12, 9, 7.2, 'MAX')}<path d="M4 19.5l5-5h11" /><path d="M17 11.5l3 3-3 3" stroke="${O}"/>`,
  receipt: `<path d="M6 3h12v18l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5-2 1.5z"/><path d="M9 8h6M9 12h6"/><path d="M9 16h3" stroke="${O}"/>`,
  partner: `<path d="M4 4h7.5l8.5 8.5-7.5 7.5L4 11.5z"/><circle cx="7.6" cy="7.6" r="1.1"/><path d="M10.6 15.4l4-4.6" stroke="${O}"/><circle cx="10.4" cy="11.4" r=".9" fill="${O}" stroke="none"/><circle cx="14.8" cy="14.8" r=".9" fill="${O}" stroke="none"/>`,
  wheelchair: CHAIR,
  card: `<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/><path d="M6.5 14.5h4" stroke="${O}"/>`,
  emoney: `<rect x="2.5" y="7" width="12.5" height="10" rx="2"/>${T(8.8, 14.3, 6, 'IC')}<path d="M17.6 9.6a4 4 0 0 1 0 4.8M20 7.6a7.4 7.4 0 0 1 0 8.8" stroke="${O}"/>`,
  ev: `${CAR}<path d="M12.9 1.8l-2 2.7h2.6l-1.6 2.5" stroke="${O}"/>`,
  toilet: `<circle cx="7.5" cy="5" r="1.5" fill="#fff" stroke="none"/><path d="M5.6 8.5h3.8v6H5.6zM6.6 14.5v5.5M8.4 14.5v5.5"/><circle cx="16.5" cy="5" r="1.5" fill="#fff" stroke="none"/><path d="M16.5 8.2l-3 6.8h6zM15.5 15v5M17.5 15v5"/><path d="M12 4v16" stroke="${O}"/>`,
  toiletAccessible: `<g transform="translate(-2.5 1.2) scale(.92)">${CHAIR}</g>${T(18.3, 8, 5.6, 'WC', O)}`,
  camera: `<path d="M3.5 7.5l11 2.4-1 4.6-11-2.4z"/><path d="M14.3 10.6l4.2 1.6-.7 2.6-4-.4"/><path d="M6.5 13.4v5.1h-3M3.5 16v4.5"/><circle cx="19.2" cy="6" r="1.3" fill="${O}" stroke="none"/>`,
  carshare: `${CAR}<path d="M8.5 6a4 4 0 0 1 7 0" stroke="${O}"/><path d="M15.9 3.4V6h-2.6" stroke="${O}"/>`,
  elevator: `<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M12 3v18"/><path d="M8.5 14v-4M7 11.4l1.5-1.5 1.5 1.5" stroke="${O}"/><path d="M15.5 10v4M14 12.6l1.5 1.5 1.5-1.5" stroke="${O}"/>`,
  height: `<path d="M3 4h18"/><g transform="translate(-1.6 5.2) scale(.8)">${CAR}</g><path d="M20.5 6.5v13M19.1 8l1.4-1.5L21.9 8M19.1 18l1.4 1.5 1.4-1.5" stroke="${O}"/>`,
  length: `<g transform="translate(1.2 -1.5) scale(.9)">${CAR}</g><path d="M3.5 20.5h17M5 19l-1.5 1.5L5 22M19 19l1.5 1.5L19 22" stroke="${O}"/>`,
  width: `<path d="M7.6 8.2l1.2-3.4h6.4l1.2 3.4"/><rect x="5.5" y="8.2" width="13" height="5.8" rx="1.6"/><path d="M7.5 14v2M16.5 14v2M8 11h1.2M14.8 11H16"/><path d="M3.5 20.5h17M5 19l-1.5 1.5L5 22M19 19l1.5 1.5L19 22" stroke="${O}"/>`,
};

/** Full <svg> markup of one icon (white 1.7px lines, round joins). */
export const facilityIconSvg = (key) =>
  `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${FACILITY_ICONS[key] || ''}</svg>`;
