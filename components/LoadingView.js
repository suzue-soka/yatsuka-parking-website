'use client';

import { useLang } from '@/components/LangProvider';

const TEXT = { ja: '読み込み中…', en: 'Loading…', zh: '加载中…' };

export default function LoadingView() {
  const lang = useLang();
  return (
    <div className="wrap page-loading" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      {TEXT[lang] || TEXT.ja}
    </div>
  );
}
