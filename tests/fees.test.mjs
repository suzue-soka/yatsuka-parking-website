import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateFee, toMinutes, formatDuration, formatDateTime } from '../lib/fees.js';

const fee = (a, b) => calculateFee(toMinutes(...a), toMinutes(...b));

test('daytime partial units round up', () => {
  assert.equal(fee(['2026-11-20', 10, 0], ['2026-11-20', 13, 30]).total, 1100);
  assert.equal(fee(['2026-11-20', 10, 0], ['2026-11-20', 10, 41]).total, 300);
});

test('daytime maximum 1,200円', () => {
  assert.equal(fee(['2026-11-20', 9, 0], ['2026-11-20', 21, 0]).total, 1200);
});

test('crossing 22:00 rounds each band separately', () => {
  const r = fee(['2026-11-20', 21, 50], ['2026-11-20', 22, 25]);
  assert.equal(r.day, 100);
  assert.equal(r.night, 100);
});

test('evening to next morning', () => {
  const r = fee(['2026-11-20', 20, 0], ['2026-11-21', 9, 0]);
  assert.equal(r.total, 1500);
  assert.equal(r.rows.length, 3);
  assert.equal(r.rows[1].capped, true);
});

test('night only, hourly units', () => {
  assert.equal(fee(['2026-11-20', 23, 0], ['2026-11-21', 2, 30]).total, 400);
});

test('night maximum across year end', () => {
  assert.equal(fee(['2026-12-31', 23, 30], ['2027-01-01', 7, 30]).total, 600);
});

test('two full days', () => {
  assert.equal(fee(['2026-11-20', 8, 0], ['2026-11-22', 8, 0]).total, 3600);
});

test('errors', () => {
  assert.equal(fee(['2026-11-20', 10, 0], ['2026-11-20', 9, 0]).error, 'order');
  assert.equal(fee(['2026-11-01', 10, 0], ['2026-12-05', 9, 0]).error, 'too_long');
  assert.equal(calculateFee(toMinutes('', 1, 1), 10).error, 'invalid');
  assert.ok(Number.isNaN(toMinutes('2026-11-20', 24, 0)));
});

test('duration format', () => {
  assert.equal(formatDuration(210), '3時間30分');
  assert.equal(formatDuration(2880), '2日');
  assert.equal(formatDuration(1), '1分');
});

test('durations and dates are localised', () => {
  assert.equal(formatDuration(210, 'en'), '3 h 30 min');
  assert.equal(formatDuration(1440, 'en'), '1 day');
  assert.equal(formatDuration(1500, 'zh'), '1天1小时');
  const t = toMinutes('2026-01-15', '10', '05');
  assert.equal(formatDateTime(t), '1/15（木）10:05');
  assert.equal(formatDateTime(t, 'en'), 'Thu 1/15 10:05');
  assert.equal(formatDateTime(t, 'zh'), '1/15（周四）10:05');
});

// 入庫後20分以内無料 (owner, 2026-11-17)
test('from 2027-02-02 stays of 20 minutes or less are free; longer stays are charged from the start', () => {
  assert.equal(fee(['2027-03-02', 10, 0], ['2027-03-02', 10, 20]).total, 0);
  assert.equal(fee(['2027-03-02', 10, 0], ['2027-03-02', 10, 21]).total, 200);
  assert.equal(fee(['2027-03-02', 23, 50], ['2027-03-03', 0, 10]).total, 0);
});

test('before 2027-02-02 only 5 minutes are free', () => {
  assert.equal(fee(['2026-12-02', 10, 0], ['2026-12-02', 10, 5]).total, 0);
  assert.equal(fee(['2026-12-02', 10, 0], ['2026-12-02', 10, 15]).total, 100);
  assert.equal(fee(['2027-02-01', 23, 55], ['2027-02-02', 0, 10]).total, 100);
});
