'use client';

import { useFormStatus } from 'react-dom';
import { useLang } from '@/components/LangProvider';

export const PENDING = { ja: '処理中…', en: 'Processing…', zh: '处理中…' };

// Submit button that shows "処理中…" with a spinner and cannot be clicked again
// while the form is being sent, so an action (e.g. an invitation email) runs only once.
export default function SubmitButton({ children, className = 'btn btn-primary', confirm, ...props }) {
  const { pending } = useFormStatus();
  const lang = useLang();
  return (
    <button
      type="submit"
      className={`${className}${pending ? ' is-pending' : ''}`}
      disabled={pending}
      aria-busy={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      {...props}
    >
      {pending ? (
        <>
          <span className="spinner" aria-hidden="true" />
          {PENDING[lang] || PENDING.ja}
        </>
      ) : (
        children
      )}
    </button>
  );
}
