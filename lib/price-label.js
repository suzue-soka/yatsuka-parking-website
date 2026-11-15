// RULE (owner, 2026-11-16): when a discount is shown together with its price, the price comes
// first and the discount goes in brackets — 300円（1時間無料）, never 1時間無料（300円）.
// Use this helper everywhere a price and a discount appear together.
export function priceLabel(price, discount, ...extra) {
  const inside = [discount, ...extra].filter(Boolean).join('・');
  return inside ? `${price}（${inside}）` : String(price);
}
