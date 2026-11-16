import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DISCOUNT_TYPES, VOLUME_TIERS } from '../lib/program-data.js';

test('program figures match the database seed', () => {
  assert.deepEqual(DISCOUNT_TYPES.map((d) => [d.code, d.yen]), [['1h', 300], ['2h', 600], ['3h', 900], ['4h', 1200], ['y1400', 1400], ['24h', 2700]]);
  assert.deepEqual(VOLUME_TIERS.map((t) => [t.min, t.max, t.rate]), [[1, 600, 10], [601, 800, 20], [801, null, 30]]);
});

test('published example: 80 × 1h at 10% = 21,600', () => {
  const tier = VOLUME_TIERS.find((t) => 80 >= t.min && (t.max === null || 80 <= t.max));
  assert.equal(Math.floor(300 * 80 * (1 - tier.rate / 100)), 21600);
});

test('application estimate uses the top of the usage range and its volume discount', async () => {
  const { estimateMonthly, USAGE_COUNT } = await import('../lib/program-data.js');
  assert.deepEqual(estimateMonthly(USAGE_COUNT['u1-200'], 300), { count: 200, gross: 60000, rate: 10, total: 54000 });
  assert.equal(estimateMonthly(USAGE_COUNT['u201-600'], 600).total, 324000);
  assert.equal(estimateMonthly(USAGE_COUNT['u601-800'], 1200).total, 768000);
  assert.equal(estimateMonthly(USAGE_COUNT['u801+'], 2700).total, 1513890);
});
