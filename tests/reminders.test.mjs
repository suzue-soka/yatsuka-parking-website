import test from 'node:test';
import assert from 'node:assert/strict';
import { planReminders, daysLate, todayJst } from '../lib/reminder-plan.js';

const inv = (id, due, total, paid = 0) => ({ id, invoice_no: id, due_on: due, total_yen: total, paid_yen: paid });

test('days late', () => {
  assert.equal(daysLate('2026-11-25', '2026-11-26'), 1);
  assert.equal(daysLate('2026-11-25', '2026-12-02'), 7);
  assert.equal(daysLate('2026-12-25', '2027-01-01'), 7);
});

test('Japan date', () => {
  assert.equal(todayJst(new Date('2026-11-25T15:30:00Z')), '2026-11-26');
  assert.equal(todayJst(new Date('2026-11-25T14:59:00Z')), '2026-11-25');
});

test('nothing on or before the due date', () => {
  const r = planReminders([inv('a', '2026-11-25', 1000)], new Set(), '2026-11-25');
  assert.equal(r.overdue.length, 0);
  assert.equal(r.send.length, 0);
});

test('first reminder the day after, once', () => {
  let r = planReminders([inv('a', '2026-11-25', 1000)], new Set(), '2026-11-26');
  assert.deepEqual(r.send.map((s) => [s.invoice.id, s.stage]), [['a', 1]]);
  r = planReminders([inv('a', '2026-11-25', 1000)], new Set(['a:1']), '2026-11-27');
  assert.equal(r.send.length, 0);
  assert.equal(r.overdue.length, 1);
});

test('second reminder after 7 days; partly paid shows the rest', () => {
  const r = planReminders([inv('a', '2026-11-25', 1000, 400)], new Set(['a:1']), '2026-12-02');
  assert.equal(r.send[0].stage, 2);
  assert.equal(r.send[0].invoice.rest, 600);
  assert.deepEqual(r.send[0].alsoMark, []);
});

test('missed days: only the latest stage is sent', () => {
  const r = planReminders([inv('a', '2026-11-25', 1000)], new Set(), '2026-12-05');
  assert.equal(r.send.length, 1);
  assert.equal(r.send[0].stage, 2);
  assert.deepEqual(r.send[0].alsoMark, [1]);
});

test('fully paid or overpaid invoices are ignored', () => {
  const r = planReminders([inv('a', '2026-11-25', 1000, 1000), inv('b', '2026-11-25', 1000, 1200)], new Set(), '2026-12-01');
  assert.equal(r.overdue.length, 0);
});
