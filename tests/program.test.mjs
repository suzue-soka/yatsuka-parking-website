import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DISCOUNT_TYPES, VOLUME_TIERS } from '../lib/program-data.js';

test('program figures match the database seed', () => {
  assert.deepEqual(DISCOUNT_TYPES.map((d) => [d.code, d.yen]), [['1h', 300], ['2h', 600], ['3h', 900], ['4h', 1200], ['24h', 2700]]);
  assert.deepEqual(VOLUME_TIERS.map((t) => t.rate), [5, 7, 10, 20]);
});

test('published example: 80 × 1h at 7% = 22,320', () => {
  const tier = VOLUME_TIERS.find((t) => 80 >= t.min && (t.max === null || 80 <= t.max));
  assert.equal(Math.floor(300 * 80 * (1 - tier.rate / 100)), 22320);
});

test('application estimate uses the top of the usage range and its volume discount', async () => {
  const { estimateMonthly, USAGE_COUNT } = await import('../lib/program-data.js');
  assert.deepEqual(estimateMonthly(USAGE_COUNT['u1-50'], 300), { count: 50, gross: 15000, rate: 5, total: 14250 });
  assert.equal(estimateMonthly(USAGE_COUNT['u51-100'], 600).total, 55800);
  assert.equal(estimateMonthly(USAGE_COUNT['u101-200'], 1200).total, 216000);
  assert.equal(estimateMonthly(USAGE_COUNT['u201+'], 2700).total, 434160);
});
