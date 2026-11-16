'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useLang } from '@/components/LangProvider';
import { PENDING } from '@/components/SubmitButton';

// 「入金を確認する」 with a safeguard (owner, 2026-11-16): when the amount entered differs from the
// remaining balance (more = overpayment, less = partial payment), ask on the page before saving —
// a typo like 145,000 for 14,500 would otherwise be recorded silently.
const T = {
  ja: {
    over: (n) => `残高より ${n}円 多い入金です（過入金になります）。金額は正しいですか？`,
    under: (n) => `残高より ${n}円 少ない入金です（一部入金になります）。金額は正しいですか？`, yes: 'はい、この金額で記録する', no: '金額を直す' },
  en: {
    over: (n) => `This is ¥${n} more than the remaining balance (it will be an overpayment). Is the amount correct?`,
    under: (n) => `This is ¥${n} less than the remaining balance (it will be a partial payment). Is the amount correct?`, yes: 'Yes, record this amount', no: 'Fix the amount' },
  zh: {
    over: (n) => `比余额多 ${n}日元（将成为多付款）。金额正确吗？`,
    under: (n) => `比余额少 ${n}日元（将成为部分付款）。金额正确吗？`, yes: '是，按此金额记录', no: '修改金额' },
};

export default function PaySubmitButton({ rest, children, className = 'btn btn-primary' }) {
  const { pending } = useFormStatus();
  const lang = useLang();
  const t = T[lang] || T.ja;
  const [diff, setDiff] = useState(0);

  if (pending) {
    return (
      <button type="button" className={`${className} is-pending`} disabled aria-busy="true">
        <span className="spinner" aria-hidden="true" />
        {PENDING[lang] || PENDING.ja}
      </button>
    );
  }

  if (diff !== 0) {
    return (
      <div className="confirm-box" role="alertdialog" aria-live="assertive" style={{ flex: '1 1 100%' }}>
        <p style={{ margin: '0 0 10px', fontWeight: 700 }}>{(diff > 0 ? t.over : t.under)(Math.abs(diff).toLocaleString('ja-JP'))}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="submit" className="btn btn-primary" autoFocus>
            {t.yes}
          </button>
          <button
            type="button"
            className="btn btn-line"
            onClick={(e) => {
              const input = e.currentTarget.form?.elements?.namedItem('amount');
              setDiff(0);
              if (input) setTimeout(() => input.focus(), 0);
            }}
          >
            {t.no}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={(e) => {
        const form = e.currentTarget.form;
        if (!form || !form.reportValidity()) return;
        const amount = Number(form.elements.namedItem('amount')?.value || 0);
        const d = amount - Number(rest || 0);
        if (d !== 0) setDiff(d);
        else form.requestSubmit();
      }}
    >
      {children}
    </button>
  );
}
