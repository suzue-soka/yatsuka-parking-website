// RULE (owner, 2026-11-16): when a discount is shown together with its price, the price comes
// first and the discount goes in brackets — 300円（1時間無料）, never 1時間無料（300円）.
// Use this helper everywhere a price and a discount appear together.
import { discountType } from '@/lib/program-data';

/** Short label of a discount value: 「1時間無料」, or the amount when it has no hour equivalent (1,400円). */
export function discountText(T, code) {
  const d = discountType(code);
  if (!d) return code;
  return d.hours ? T.discount(d.hours) : T.yen(d.yen.toLocaleString('ja-JP'));
}

export function priceLabel(price, discount, ...extra) {
  const inside = [discount, ...extra].filter(Boolean).join('・');
  return inside ? `${price}（${inside}）` : String(price);
}
