'use client';

import { useState } from 'react';
import SubmitButton from '@/components/SubmitButton';
import MachineFields from '@/components/MachineFields';

/**
 * Request for extra validation machines (1–5, each with 1–2 discount values); the admin approves it,
 * then the partner orders it. `labels` holds plain strings only (passed from a server page).
 */
export default function MachineOrderForm({ action, unitYen, defaults = [], labels }) {
  const [count, setCount] = useState(1);
  const yen = (n) => labels.yenFormat.replace('{n}', n.toLocaleString('ja-JP'));
  return (
    <form action={action} className="form">
      <MachineFields labels={labels} defaults={defaults} onChange={(items) => setCount(items.length)} />
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
