'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SetPassword() {
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (pw.length < 12) return setError('12文字以上のパスワードを設定してください。');
    if (pw !== pw2) return setError('確認用のパスワードが一致しません。');
    setBusy(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (err) return setError('パスワードを設定できませんでした。リンクの有効期限が切れている可能性があります。');
    router.replace('/login/mfa');
  }

  return (
    <div className="card">
      <h1 style={{ marginTop: 0, fontSize: 24 }}>パスワードの設定</h1>
      <form onSubmit={onSubmit} className="form">
        <label htmlFor="pw">新しいパスワード（12文字以上）</label>
        <input id="pw" type="password" autoComplete="new-password" required value={pw} onChange={(e) => setPw(e.target.value)} />
        <label htmlFor="pw2">確認のためもう一度</label>
        <input id="pw2" type="password" autoComplete="new-password" required value={pw2} onChange={(e) => setPw2(e.target.value)} />
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          設定して次へ
        </button>
      </form>
    </div>
  );
}
