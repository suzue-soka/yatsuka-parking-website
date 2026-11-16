// Which overdue reminder each invoice needs today (pure; tested in tests/reminders.test.mjs).
// Owner, 2026-11-16: first reminder 1 day after the due date, second 7 days after; partly paid
// invoices too. If the job missed a few days, only the latest stage due is sent (never both).

const dayNo = (s) => Date.UTC(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10))) / 86400000;

/** Whole days from the due date to today (positive = late). */
export const daysLate = (due, today) => dayNo(today) - dayNo(due);

/**
 * @param invoices [{ id, due_on, total_yen, paid_yen }]  published (unpaid or partly paid) invoices
 * @param sent     Set of `${invoice_id}:${stage}` already recorded
 * @param today    'YYYY-MM-DD' (Japan time)
 * @returns { overdue: [{ ...invoice, late, rest }], send: [{ invoice, stage, alsoMark: [stages] }] }
 */
export function planReminders(invoices, sent, today) {
  const overdue = [];
  const send = [];
  for (const inv of invoices) {
    if (!inv.due_on) continue;
    const late = daysLate(inv.due_on, today);
    const rest = Number(inv.total_yen || 0) - Number(inv.paid_yen || 0);
    if (late < 1 || rest <= 0) continue;
    const row = { ...inv, late, rest };
    overdue.push(row);
    const has = (s) => sent.has(`${inv.id}:${s}`);
    if (late >= 7 && !has(2)) send.push({ invoice: row, stage: 2, alsoMark: has(1) ? [] : [1] });
    else if (late >= 1 && late < 7 && !has(1)) send.push({ invoice: row, stage: 1, alsoMark: [] });
  }
  overdue.sort((a, b) => b.late - a.late || String(a.invoice_no).localeCompare(String(b.invoice_no)));
  return { overdue, send };
}

/** Today's date in Japan, 'YYYY-MM-DD'. */
export function todayJst(now = new Date()) {
  return new Date(now.getTime() + 9 * 3600000).toISOString().slice(0, 10);
}
