// 駐車料金の計算（料金シミュレーター）
//
// Rules (confirmed by the owner, rounding at band edges still to be confirmed with Amano):
// - Japan Standard Time. Dates/times are treated as JST wall-clock minutes (Japan has no DST).
// - 昼間 08:00–22:00: 100円 / 20分, 最大 1,200円 per daytime band.
// - 夜間 22:00–08:00: 100円 / 60分, 最大 600円 per night band.
// - Partial units are rounded up within each band.
// - Free time, by arrival date (owner 2026-11-17): ticket system until 2027-02-01 = 入庫後5分以内無料;
//   ticketless system from 2027-02-02 = 入庫後20分以内無料. A longer stay is charged from the start.

export const RATES = {
  day: { kind: '昼間', start: 8 * 60, end: 22 * 60, unit: 20, price: 100, cap: 1200 },
  night: { kind: '夜間', unit: 60, price: 100, cap: 600 },
};

export const MAX_DAYS = 31;
export const FREE_MINUTES = 20;
export const OLD_FREE_MINUTES = 5;
export const TICKETLESS_FROM = Date.UTC(2027, 1, 2) / 60000; // 2027-02-02 00:00 JST, in the same wall-clock minutes

/** Free minutes for a stay that starts at `start` (minutes since epoch, JST wall clock). */
export const freeMinutesFor = (start) => (start >= TICKETLESS_FROM ? FREE_MINUTES : OLD_FREE_MINUTES);

/** Convert "YYYY-MM-DD" + hour + minute to minutes since 1970-01-01 (JST wall clock). */
export function toMinutes(date, hour, minute) {
  const parts = String(date || '').split('-').map(Number);
  const h = Number(hour);
  const m = Number(minute);
  if (parts.length !== 3 || parts.some(Number.isNaN) || Number.isNaN(h) || Number.isNaN(m)) return NaN;
  if (h < 0 || h > 23 || m < 0 || m > 59) return NaN;
  return Date.UTC(parts[0], parts[1] - 1, parts[2]) / 60000 + h * 60 + m;
}

/** Minutes since epoch → { date: 'YYYY-MM-DD', hour: 'HH', minute: 'MM' } */
export function fromMinutes(t) {
  const d = new Date(t * 60000);
  return {
    date: d.toISOString().slice(0, 10),
    hour: String(d.getUTCHours()).padStart(2, '0'),
    minute: String(d.getUTCMinutes()).padStart(2, '0'),
  };
}

/**
 * Calculate the parking fee between two times (minutes since epoch, JST wall clock).
 * Returns { error } or { total, day, night, dayMinutes, nightMinutes, minutes, rows }.
 */
export function calculateFee(start, end) {
  if (Number.isNaN(start) || Number.isNaN(end)) return { error: 'invalid' };
  if (end <= start) return { error: 'order' };
  if (end - start > MAX_DAYS * 1440) return { error: 'too_long' };

  const rows = [];
  let day = 0;
  let night = 0;
  let dayMinutes = 0;
  let nightMinutes = 0;

  for (let k = Math.floor(start / 1440); k <= Math.floor(end / 1440) + 1; k++) {
    const base = k * 1440;
    const bands = [
      ['night', base - 120, base + 480], // 22:00 previous day → 08:00
      ['day', base + 480, base + 1320], // 08:00 → 22:00
    ];
    for (const [key, s0, e0] of bands) {
      const s = Math.max(start, s0);
      const e = Math.min(end, e0);
      if (e <= s) continue;
      const rate = RATES[key];
      const minutes = e - s;
      const units = Math.ceil(minutes / rate.unit);
      const raw = units * rate.price;
      const yen = Math.min(raw, rate.cap);
      if (key === 'day') {
        day += yen;
        dayMinutes += minutes;
      } else {
        night += yen;
        nightMinutes += minutes;
      }
      rows.push({ key, kind: rate.kind, start: s, end: e, minutes, units, yen, capped: raw > rate.cap });
    }
  }

  const freeMinutes = freeMinutesFor(start);
  if (end - start <= freeMinutes) {
    return { total: 0, day: 0, night: 0, dayMinutes, nightMinutes, minutes: end - start, free: true, freeMinutes,
      rows: rows.map((r) => ({ ...r, yen: 0, capped: false })) };
  }
  return { total: day + night, day, night, dayMinutes, nightMinutes, minutes: end - start, rows };
}

const WEEKDAYS = {
  ja: ['日', '月', '火', '水', '木', '金', '土'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  zh: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
};
const pad = (n) => String(n).padStart(2, '0');

export function formatDateTime(t, lang = 'ja') {
  const d = new Date(t * 60000);
  const md = `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  const wd = (WEEKDAYS[lang] || WEEKDAYS.ja)[d.getUTCDay()];
  const hm = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  return lang === 'en' ? `${wd} ${md} ${hm}` : `${md}（${wd}）${hm}`;
}

export function formatTime(t) {
  const d = new Date(t * 60000);
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

const DURATION = {
  ja: { d: (n) => `${n}日`, h: (n) => `${n}時間`, m: (n) => `${n}分`, sep: '' },
  en: { d: (n) => `${n} ${n === 1 ? 'day' : 'days'}`, h: (n) => `${n} h`, m: (n) => `${n} min`, sep: ' ' },
  zh: { d: (n) => `${n}天`, h: (n) => `${n}小时`, m: (n) => `${n}分钟`, sep: '' },
};

export function formatDuration(m, lang = 'ja') {
  const f = DURATION[lang] || DURATION.ja;
  const days = Math.floor(m / 1440);
  const hours = Math.floor((m % 1440) / 60);
  const mins = m % 60;
  const parts = [];
  if (days) parts.push(f.d(days));
  if (hours) parts.push(f.h(hours));
  if (mins || !parts.length) parts.push(f.m(mins));
  return parts.join(f.sep);
}

export const yen = (n) => n.toLocaleString('ja-JP');
