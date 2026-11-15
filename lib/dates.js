// Japan Standard Time helpers (Japan has no daylight saving time).
const JST = 9 * 3600 * 1000;

export function jstToday() {
  return new Date(Date.now() + JST).toISOString().slice(0, 10);
}

/** 'YYYY-MM' from ?m= or the current JST month. */
export function monthParam(m) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(m || '') ? m : jstToday().slice(0, 7);
}

export function monthRange(ym) {
  const [y, mo] = ym.split('-').map(Number);
  const from = `${ym}-01`;
  const next = mo === 12 ? `${y + 1}-01-01` : `${y}-${String(mo + 1).padStart(2, '0')}-01`;
  return { from, to: next };
}

export function shiftMonth(ym, delta) {
  const [y, mo] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

/** ISO timestamp → 'YYYY-MM-DD' in JST */
export function jstDate(iso) {
  return new Date(new Date(iso).getTime() + JST).toISOString().slice(0, 10);
}

export function jstDateTime(iso) {
  const d = new Date(new Date(iso).getTime() + JST);
  return `${d.getUTCFullYear()}/${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

export const yen = (n) => (n ?? 0).toLocaleString('ja-JP');

/** Billed period of a monthly invoice: '2026-10-01〜2026-10-31' (period_month = first day). */
export function periodRange(periodMonth) {
  if (!periodMonth) return null;
  const [y, m] = periodMonth.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${periodMonth.slice(0, 7)}-01〜${periodMonth.slice(0, 7)}-${String(last).padStart(2, '0')}`;
}
