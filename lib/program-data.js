// Partner program figures (tax included). Must match the discount_types and volume_tiers tables.
export const DISCOUNT_TYPES = [
  { code: '1h', hours: 1, yen: 300 },
  { code: '2h', hours: 2, yen: 600 },
  { code: '3h', hours: 3, yen: 900 },
  { code: '4h', hours: 4, yen: 1200 },
  { code: '24h', hours: 24, yen: 2700 },
];

export const VOLUME_TIERS = [
  { min: 1, max: 50, rate: 5 },
  { min: 51, max: 100, rate: 7 },
  { min: 101, max: 200, rate: 10 },
  { min: 201, max: null, rate: 20 },
];

export const CATEGORIES = ['retail', 'food', 'medical', 'beauty', 'service', 'hotel', 'leisure', 'finance', 'other'];
export const USAGE = ['u1-50', 'u51-100', 'u101-200', 'u201+', 'unknown'];
export const DOC_KINDS = ['registry', 'kaigyo'];
export const MAX_DOC_BYTES = 4 * 1024 * 1024;
