// Working days for billing (owner, 2026-11-16): not Saturday or Sunday and not a Japanese public
// holiday (国民の祝日・振替休日・国民の休日). 鈴江's own holidays are not taken into account.
// Dates are 'YYYY-MM-DD' strings in Japan time; arithmetic is done in UTC to avoid time-zone drift.

const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const date = (s) => new Date(`${s}T00:00:00Z`);
export const addDays = (s, n) => {
  const d = date(s);
  d.setUTCDate(d.getUTCDate() + n);
  return ymd(d);
};
const weekday = (s) => date(s).getUTCDay(); // 0 = Sunday

// n-th Monday of a month (month 1–12)
function nthMonday(y, m, n) {
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const day = 1 + ((8 - first) % 7) + (n - 1) * 7;
  return `${y}-${pad(m)}-${pad(day)}`;
}

// 春分の日 / 秋分の日 (valid 1980–2099)
const vernal = (y) => Math.floor(20.8431 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
const autumnal = (y) => Math.floor(23.2488 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));

/** National holidays of a year (current law), including 振替休日 and 国民の休日. */
export function jpHolidays(y) {
  const base = new Set([
    `${y}-01-01`,
    nthMonday(y, 1, 2), // 成人の日
    `${y}-02-11`,
    `${y}-02-23`,
    `${y}-03-${pad(vernal(y))}`,
    `${y}-04-29`,
    `${y}-05-03`,
    `${y}-05-04`,
    `${y}-05-05`,
    nthMonday(y, 7, 3), // 海の日
    `${y}-08-11`,
    nthMonday(y, 9, 3), // 敬老の日
    `${y}-09-${pad(autumnal(y))}`,
    nthMonday(y, 10, 2), // スポーツの日
    `${y}-11-03`,
    `${y}-11-23`,
  ]);
  const all = new Set(base);
  // 国民の休日: a weekday between two holidays
  for (const h of base) {
    const next = addDays(h, 2);
    const mid = addDays(h, 1);
    if (base.has(next) && !base.has(mid) && weekday(mid) !== 0) all.add(mid);
  }
  // 振替休日: a holiday on Sunday moves to the next day that is not a holiday
  for (const h of [...all].sort()) {
    if (weekday(h) !== 0) continue;
    let d = addDays(h, 1);
    while (all.has(d)) d = addDays(d, 1);
    all.add(d);
  }
  return all;
}

const cache = new Map();
export function isJpHoliday(s) {
  const y = Number(s.slice(0, 4));
  if (!cache.has(y)) cache.set(y, jpHolidays(y));
  return cache.get(y).has(s);
}

export function isWorkingDay(s) {
  const w = weekday(s);
  return w !== 0 && w !== 6 && !isJpHoliday(s);
}

/** Due date: the 25th of the month of `issued`, or the closest working day (earlier one on a tie). */
export function dueDate(issued) {
  const target = `${issued.slice(0, 7)}-25`;
  for (let k = 0; k < 40; k++) {
    const before = addDays(target, -k);
    if (isWorkingDay(before)) return before;
    const after = addDays(target, k);
    if (isWorkingDay(after)) return after;
  }
  return target;
}

/** Last day of a month given as 'YYYY-MM-01'. */
export const monthEnd = (month) => addDays(addMonths(month, 1), -1);
export function addMonths(month, n) {
  const d = date(month);
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  return ymd(d);
}

/** Due date of a shortfall invoice (不足額のご請求): the usual 25th rule, but at least 7 days after
 *  issuing — otherwise the 25th (or closest working day) of the following month. */
export function balanceDueDate(issued) {
  const d = dueDate(issued);
  return d >= addDays(issued, 7) ? d : dueDate(addMonths(`${issued.slice(0, 7)}-01`, 1));
}
