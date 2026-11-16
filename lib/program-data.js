// Partner program figures (tax included). Must match the discount_types and volume_tiers tables.
export const DISCOUNT_TYPES = [
  { code: '1h', hours: 1, yen: 300 },
  { code: '2h', hours: 2, yen: 600 },
  { code: '3h', hours: 3, yen: 900 },
  { code: '4h', hours: 4, yen: 1200 },
  { code: 'y1400', hours: null, yen: 1400 }, // money value without an hour equivalent (owner, 2026-11-17)
  { code: '24h', hours: 24, yen: 2700 },
];

// Values the admin can assign but partners cannot choose (not in the public price list; none at the moment).
// Validation values are amounts of money; hours is only the daytime equivalent and is null when there is none.
export const EXTRA_DISCOUNT_TYPES = [];

/** Any discount value by code (public list first, then admin-only values). */
export const discountType = (code) =>
  DISCOUNT_TYPES.find((d) => d.code === code) || EXTRA_DISCOUNT_TYPES.find((d) => d.code === code);

export const VOLUME_TIERS = [
  { min: 1, max: 50, rate: 5 },
  { min: 51, max: 100, rate: 7 },
  { min: 101, max: 200, rate: 10 },
  { min: 201, max: null, rate: 20 },
];

export const CATEGORIES = ['retail', 'food', 'medical', 'beauty', 'service', 'hotel', 'leisure', 'finance', 'other'];
export const USAGE = ['u1-50', 'u51-100', 'u101-200', 'u201+', 'unknown'];

// Validations used for the application-form estimate: the top of each range (201 for "201 or more").
export const USAGE_COUNT = { 'u1-50': 50, 'u51-100': 100, 'u101-200': 200, 'u201+': 201 };

// Monthly invoice estimate, tax included: count × unit price, less the volume discount, yen rounded down.
export function estimateMonthly(count, unitYen) {
  const tier = VOLUME_TIERS.find((t) => count >= t.min && (t.max === null || count <= t.max));
  const gross = count * unitYen;
  return { count, gross, rate: tier.rate, total: Math.floor((gross * (100 - tier.rate)) / 100) };
}
export const DOC_KINDS = ['registry', 'kaigyo'];
export const MAX_DOC_BYTES = 4 * 1024 * 1024;
