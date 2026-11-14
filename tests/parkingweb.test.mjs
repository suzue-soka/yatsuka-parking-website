import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseReport, splitCsvLine, toIsoJst } from '../lib/parkingweb.js';

// Made-up sample in the same layout as the ParkingWeb export (two pages, two 店No.).
const PAGE_HEADER = [
  '掛売割引利用明細,,,,,,,',
  ',,,,,,,',
  '駐車場：谷塚駅東口共同駐車場,,,,,,,',
  '出力形式：割引毎の精算単位,,,,,,,',
  '対象期間：2026年01月01日 (木) 00:00 ～2026年01月31日 (土) 23:59,,,,,,,印刷日時：2026年02月02日 15:11',
  '券種別,,店No.,精算日時,入庫日時,,枚数／回数,割引額（円）',
];
const SAMPLE = [
  ...PAGE_HEADER,
  'テスト店A,,3,2026/1/2 12:32,2026/1/2 12:17,,1,100',
  'テスト店A,,3,2026/1/2 12:52,2026/1/2 12:24,,1,200',
  ',,,,小計,,2,300',
  ...PAGE_HEADER,
  'テスト店B,,9,2026/1/13 22:20,2026/1/13 10:43,,1,"1,300"',
  'テスト店B,,9,2026/1/13 22:20,2026/1/13 10:43,,1,"1,300"',
  ',,,,小計,,2,"2,600"',
  ',,,,,,,',
  '合計,,,,,,4,"2,900"',
].join('\r\n');

test('parses rows, skips repeated page headers, checks totals', () => {
  const r = parseReport(SAMPLE);
  assert.deepEqual(r.problems, []);
  assert.equal(r.rows.length, 4);
  assert.deepEqual(r.total, { count: 4, amount: 2900 });
  assert.equal(r.period.from, '2026-01-01T00:00:00+09:00');
  assert.equal(r.rows[2].discountYen, 1300);
  assert.equal(r.rows[0].paidAt, '2026-01-02T12:32:00+09:00');
});

test('keeps identical rows (no transaction ID in ParkingWeb)', () => {
  const r = parseReport(SAMPLE);
  const same = r.rows.filter((x) => x.storeNo === 9);
  assert.equal(same.length, 2);
});

test('reports a subtotal mismatch', () => {
  const bad = SAMPLE.replace(',,,,小計,,2,300', ',,,,小計,,2,400');
  const r = parseReport(bad);
  assert.ok(r.problems.some((p) => p.includes('店No.3')));
});

test('reports a missing total', () => {
  const r = parseReport(SAMPLE.replace('合計,,,,,,4,"2,900"', ''));
  assert.ok(r.problems.includes('合計 row missing'));
});

test('helpers', () => {
  assert.deepEqual(splitCsvLine('a,"1,308",b'), ['a', '1,308', 'b']);
  assert.equal(toIsoJst('2026/1/5 8:52'), '2026-01-05T08:52:00+09:00');
  assert.equal(toIsoJst('nonsense'), null);
});
