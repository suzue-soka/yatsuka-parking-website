'use client';

import { useState } from 'react';
import SubmitButton from '@/components/SubmitButton';
import { DISCOUNT_TYPES } from '@/lib/program-data';

/**
 * Order 1–5 validation machines; each machine has its own 1–2 discount values.
 * `labels` holds plain strings only (passed from a server page).
 */
export default function MachineOrderForm({ action, unitYen, defaults = [], labels }) {
  const [count, setCount] = useState(1);
  const first = defaults[0] || '1h';
  const second = defaults[1] || '';
  const yen = (n) => labels.yenFormat.replace('{n}', n.toLocaleString('ja-JP'));
  const dLabel = (d) => labels.discount.replace('{h}', d.hours) + `（${yen(d.yen)}）`;

  return (
    <form action={action} className="form">
      <label htmlFor="count">{labels.count}</label>
      <select id="count" name="count" value={count} onChange={(e) => setCount(Number(e.target.value))}>
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
              <select id={`d_${i}_0`} name={`d_${i}_0`} defaultValue={first} required>
                {DISCOUNT_TYPES.map((d) => (
                  <option key={d.code} value={d.code}>
                    {dLabel(d)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form">
              <label htmlFor={`d_${i}_1`}>{labels.value2}</label>
              <select id={`d_${i}_1`} name={`d_${i}_1`} defaultValue={second}>
                <option value="">{labels.none}</option>
                {DISCOUNT_TYPES.map((d) => (
                  <option key={d.code} value={d.code}>
                    {dLabel(d)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>
      ))}
      <p className="order-total">
        {labels.total}：<strong>{yen(unitYen * count)}</strong>
        <span className="small muted">（{yen(unitYen)} × {count}）</span>
      </p>
      <SubmitButton className="btn btn-primary" confirm={labels.confirm}>
        {labels.submit}
      </SubmitButton>
    </form>
  );
}
