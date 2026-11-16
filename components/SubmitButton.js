'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useLang } from '@/components/LangProvider';

export const PENDING = { ja: '処理中…', en: 'Processing…', zh: '处理中…' };
const ASK = {
  ja: { yes: 'はい、実行する', no: 'キャンセル' },
  en: { yes: 'Yes, go ahead', no: 'Cancel' },
  zh: { yes: '是，执行', no: '取消' },
};

// Submit button that shows "処理中…" with a spinner and cannot be clicked again while the
// form is being sent, so an action (e.g. an invitation email) runs only once.
// With `confirm`, the first click asks on the page itself (browser pop-ups are blocked in
// some browsers, including in-app browsers), and only "はい" sends the form.
// With `require` (a field name) and `requireMsg`, the button first checks that field is filled in and
// otherwise shows `requireMsg` right under the button and focuses the field (e.g. the write-off note).
export default function SubmitButton({ children, className = 'btn btn-primary', confirm, require, requireMsg, ...props }) {
  const { pending } = useFormStatus();
  const lang = useLang();
  const [asking, setAsking] = useState(false);
  const [missing, setMissing] = useState(false);
  const a = ASK[lang] || ASK.ja;

  // Returns true when the required field is empty (and shows the message).
  const checkRequired = (e) => {
    if (!require) return false;
    const field = e.currentTarget.form?.elements?.namedItem(require);
    if (field && !String(field.value || '').trim()) {
      setMissing(true);
      field.focus();
      return true;
    }
    setMissing(false);
    return false;
  };
  const missingNote = missing && requireMsg ? (
    <p className="alert small" role="alert" style={{ margin: '6px 0 0', flex: '1 1 100%' }}>
      {requireMsg}
    </p>
  ) : null;

  if (pending) {
    return (
      <button type="button" className={`${className} is-pending`} disabled aria-busy="true">
        <span className="spinner" aria-hidden="true" />
        {PENDING[lang] || PENDING.ja}
      </button>
    );
  }

  if (confirm && !asking) {
    return (
      <>
        <button type="button" className={className} onClick={(e) => !checkRequired(e) && setAsking(true)}>
          {children}
        </button>
        {missingNote}
      </>
    );
  }

  if (confirm && asking) {
    return (
      <div className="confirm-box" role="alertdialog" aria-live="assertive">
        <p style={{ margin: '0 0 10px', fontWeight: 700 }}>{confirm}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="submit" className="btn btn-primary" autoFocus {...props}>
            {a.yes}
          </button>
          <button type="button" className="btn btn-line" onClick={() => setAsking(false)}>
            {a.no}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button type="submit" className={className} {...props} onClick={(e) => checkRequired(e) && e.preventDefault()}>
        {children}
      </button>
      {missingNote}
    </>
  );
}
