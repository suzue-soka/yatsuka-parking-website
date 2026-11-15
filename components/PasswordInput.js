'use client';

import { useState } from 'react';
import { useLang } from '@/components/LangProvider';

const LABELS = {
  ja: { show: 'パスワードを表示', hide: 'パスワードを隠す' },
  en: { show: 'Show password', hide: 'Hide password' },
  zh: { show: '显示密码', hide: '隐藏密码' },
};

// Password field with an eye button that shows or hides what was typed.
export default function PasswordInput(props) {
  const [visible, setVisible] = useState(false);
  const l = LABELS[useLang()] || LABELS.ja;
  return (
    <div className="pw-field">
      <input {...props} type={visible ? 'text' : 'password'} autoCapitalize="off" spellCheck={false} />
      <button
        type="button"
        className="pw-toggle"
        aria-label={visible ? l.hide : l.show}
        aria-pressed={visible}
        aria-controls={props.id}
        title={visible ? l.hide : l.show}
        onClick={() => setVisible((v) => !v)}
      >
        <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <path d="M3 3l18 18" />}
        </svg>
      </button>
    </div>
  );
}
