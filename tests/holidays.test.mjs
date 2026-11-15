import test from 'node:test';
import assert from 'node:assert/strict';
import { jpHolidays, isWorkingDay, dueDate, monthEnd, addMonths } from '../lib/holidays.js';

test('2026 national holidays (Cabinet Office list)', () => {
  const h = [...jpHolidays(2026)].sort();
  assert.deepEqual(h, [
    '2026-01-01', '2026-01-12', '2026-02-11', '2026-02-23', '2026-03-20', '2026-04-29',
    '2026-05-03', '2026-05-04', '2026-05-05', '2026-05-06', '2026-07-20', '2026-08-11',
    '2026-09-21', '2026-09-22', '2026-09-23', '2026-10-12', '2026-11-03', '2026-11-23',
  ]);
});

test('2027 national holidays include substitute days', () => {
  const h = jpHolidays(2027);
  assert.ok(h.has('2027-03-22')); // 振替休日 (春分の日 3/21 is a Sunday)
  assert.ok(h.has('2027-02-11') && h.has('2027-11-23'));
});

test('due date: 25th or the closest working day', () => {
  assert.equal(dueDate('2026-12-01'), '2026-12-25'); // Friday
  assert.equal(dueDate('2027-07-01'), '2027-07-26'); // 25th Sunday → Monday (1 day) beats Friday 23rd (2 days)
  assert.equal(dueDate('2026-10-01'), '2026-10-26'); // 25th Sunday → Monday
  assert.equal(dueDate('2027-09-01'), '2027-09-24'); // 25th Saturday → Friday (tie-free, 1 day)
});

test('working days and month helpers', () => {
  assert.equal(isWorkingDay('2026-11-23'), false); // 勤労感謝の日
  assert.equal(isWorkingDay('2026-11-24'), true);
  assert.equal(monthEnd('2026-02-01'), '2026-02-28');
  assert.equal(addMonths('2026-12-01', 1), '2027-01-01');
});
