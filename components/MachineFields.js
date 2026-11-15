'use client';

import { useState } from 'react';
import { DISCOUNT_TYPES } from '@/lib/program-data';

/**
 * Number of machines (1–5) and the 1–2 discount values of each machine.
 * Field names: count, d_<machine>_0 (required), d_<machine>_1 (optional).
 * `labels` holds plain strings: count, machine ('… {n} …'), value1, value2, none, choose, discount ('{h}'), yenFormat ('{n}').
 * `onChange(items)` receives [{ discounts: [...] }, …] whenever a choice changes.
 */
export default function MachineFields({ labels, defaults = [], onChange, required = true }) {
  const [count, setCount] = useState(1);
  const [items, setItems] = useState(() => Array.from({ length: 5 }, () => [defaults[0] || '', defaults[1] || '']));
  const yen = (n) => labels.yenFormat.replace('{n}', n.toLocaleString('ja-JP'));
  const dLabel = (d) => labels.discount.replace('{h}', d.hours) + `（${yen(d.yen)}）`;

  const report = (n, list) =>
    onChange?.(list.slice(0, n).map(([a, b]) => ({ discounts: [a, b].filter(Boolean).filter((v, i, x) => x.indexOf(v) === i) })));
  const setValue = (i, j, v) => {
    const next = items.map((row, k) => (k === i ? (j === 0 ? [v, row[1]] : [row[0], v]) : row));
    setItems(next);
    report(count, next);
  };

  return (
    <>
      <label htmlFor="count">{labels.count}</label>
      <select
        id="count"
        name="count"
        value={count}
        onChange={(e) => {
          const n = Number(e.target.value);
          setCount(n);
          report(n, items);
        }}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      {Array.from({ length: count }, (_, i) => (
        <fieldset key={i} className="order-machine">
          <legend>{labels.machine.replace('{n}', i + 1)}</legend>
          <div className="order-machine-row">
            <div className="form">
              <label htmlFor={`d_${i}_0`}>{labels.value1}</label>
              <select id={`d_${i}_0`} name={`d_${i}_0`} value={items[i][0]} required={required} onChange={(e) => setValue(i, 0, e.target.value)}>
                <option value="" disabled>
                  {labels.choose}
                </option>
                {DISCOUNT_TYPES.map((d) => (
                  <option key={d.code} value={d.code}>
                    {dLabel(d)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form">
              <label htmlFor={`d_${i}_1`}>{labels.value2}</label>
              <select id={`d_${i}_1`} name={`d_${i}_1`} value={items[i][1]} onChange={(e) => setValue(i, 1, e.target.value)}>
                <option value="">{labels.none}</option>
                {DISCOUNT_TYPES.filter((d) => d.code !== items[i][0]).map((d) => (
                  <option key={d.code} value={d.code}>
                    {dLabel(d)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>
      ))}
    </>
  );
}

