// ParkingWeb 「掛売割引利用明細」（出力形式：割引毎の精算単位） CSV parser.
//
// ParkingWeb downloads the file in Shift_JIS (cp932). A copy opened and saved again in Excel is
// accepted too (owner, 2026-11-17): UTF-8 text and US-style dates (3/1/2026 10:53); every date must
// then still fall inside the report's 対象期間, and the 小計/合計 checks apply as before.
// It repeats a 5-line page header, has a 小計 row
// after each 店No. and a final 合計 row. There is no transaction ID, so identical
// rows are kept and counted (see the database import for count-based de-duplication).

const HEADER_FIELDS = ['券種別', '', '店No.', '精算日時', '入庫日時', '', '枚数／回数', '割引額（円）'];

/** Decode the raw file (ArrayBuffer/Uint8Array/Buffer) from Shift_JIS. */
export function decodeShiftJis(bytes) {
  return new TextDecoder('shift_jis').decode(bytes);
}

/** Decode the raw file: UTF-8 when the bytes are valid UTF-8 (a copy saved by Excel), otherwise Shift_JIS. */
export function decodeReport(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^\uFEFF/, '');
  } catch {
    return decodeShiftJis(bytes);
  }
}

/** Split one CSV line, honouring double quotes ("1,308"). */
export function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

const toInt = (s) => {
  const n = Number(String(s ?? '').replace(/,/g, '').trim());
  return Number.isInteger(n) ? n : NaN;
};

/** "2026/1/2 12:32" or, from Excel, "1/2/2026 12:32" (month/day/year), JST → ISO string with +09:00 offset. */
export function toIsoJst(s) {
  const t = String(s).trim();
  const p = (x) => String(x).padStart(2, '0');
  let m = /^(\d{4})\/(\d{1,2})\/(\d{1,2}) (\d{1,2}):(\d{2})(?::\d{2})?$/.exec(t);
  if (m) return `${m[1]}-${p(m[2])}-${p(m[3])}T${p(m[4])}:${m[5]}:00+09:00`;
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{2})(?::\d{2})?$/.exec(t);
  if (m && Number(m[1]) <= 12) return `${m[3]}-${p(m[1])}-${p(m[2])}T${p(m[4])}:${m[5]}:00+09:00`;
  return null;
}

/**
 * Parse the report text.
 * Returns { rows, period, subtotals, total, problems }.
 * rows: { ticketType, storeNo, paidAt, enteredAt, count, discountYen }
 * problems: list of strings; an import must be blocked when it is not empty.
 */
export function parseReport(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  const rows = [];
  const subtotals = []; // { storeNo, count, amount }
  const problems = [];
  let total = null;
  let period = null;
  let sawHeader = false;
  let group = { storeNo: null, count: 0, amount: 0 };

  lines.forEach((line, idx) => {
    if (!line.trim() || /^,*$/.test(line)) return;
    const f = splitCsvLine(line);

    if (/^(掛売割引利用明細|駐車場：|出力形式：)/.test(f[0])) return; // repeated page header
    if (f[0].startsWith('対象期間：')) {
      const m = /(\d{4})年(\d{2})月(\d{2})日.*?(\d{2}):(\d{2}).*?(\d{4})年(\d{2})月(\d{2})日.*?(\d{2}):(\d{2})/.exec(f[0]);
      if (m) period = { from: `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:00+09:00`, to: `${m[6]}-${m[7]}-${m[8]}T${m[9]}:${m[10]}:00+09:00` };
      return;
    }
    if (f[0] === '券種別') {
      sawHeader = true;
      if (HEADER_FIELDS.some((h, i) => h && f[i] !== h)) problems.push(`line ${idx + 1}: unexpected column header`);
      return;
    }
    if (f[0] === '合計') {
      total = { count: toInt(f[6]), amount: toInt(f[7]) };
      return;
    }
    if (f[4] === '小計') {
      const st = { storeNo: group.storeNo, count: toInt(f[6]), amount: toInt(f[7]) };
      subtotals.push(st);
      if (st.count !== group.count || st.amount !== group.amount) {
        problems.push(`店No.${group.storeNo}: 小計 ${st.count}件/${st.amount}円 but rows add up to ${group.count}件/${group.amount}円`);
      }
      group = { storeNo: null, count: 0, amount: 0 };
      return;
    }
    if (!sawHeader) return; // title lines before the first header

    const storeNo = toInt(f[2]);
    const paidAt = toIsoJst(f[3]);
    const enteredAt = toIsoJst(f[4]);
    const count = toInt(f[6]);
    const discountYen = toInt(f[7]);
    if (!f[0] || Number.isNaN(storeNo) || !paidAt || !enteredAt || Number.isNaN(count) || Number.isNaN(discountYen)) {
      problems.push(`line ${idx + 1}: unreadable row`);
      return;
    }
    if (group.storeNo !== null && group.storeNo !== storeNo) problems.push(`line ${idx + 1}: 店No. changed without a 小計 row`);
    group.storeNo = storeNo;
    group.count += count;
    group.amount += discountYen;
    rows.push({ ticketType: f[0], storeNo, paidAt, enteredAt, count, discountYen });
  });

  if (!sawHeader) problems.push('no column header found — not a 掛売割引利用明細 report');
  if (group.count) problems.push(`店No.${group.storeNo}: rows after the last 小計`);
  const sumCount = rows.reduce((s, r) => s + r.count, 0);
  const sumAmount = rows.reduce((s, r) => s + r.discountYen, 0);
  // Every 精算日時 must lie inside the report's 対象期間 (also confirms how a US-style date was read).
  if (period) {
    const from = Date.parse(period.from);
    const to = Date.parse(period.to) + 59999; // the period ends at 23:59, inclusive
    const outside = rows.filter((r) => Date.parse(r.paidAt) < from || Date.parse(r.paidAt) > to).length;
    if (outside) problems.push(`${outside} rows have a 精算日時 outside the 対象期間`);
  }
  if (!total) problems.push('合計 row missing');
  else if (total.count !== sumCount || total.amount !== sumAmount) {
    problems.push(`合計 ${total.count}件/${total.amount}円 but rows add up to ${sumCount}件/${sumAmount}円`);
  }
  return { rows, period, subtotals, total, problems };
}
