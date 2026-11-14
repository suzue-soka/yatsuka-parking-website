'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(params.get('error') === 'link' ? 'メールのリンクが無効か、有効期限が切れています。もう一度お試しください。' : '');
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) {
      setError('メールアドレスまたはパスワードが正しくありません。');
      return;
    }
    const next = params.get('next');
    router.replace(`/login/mfa${next ? `?next=${encodeURIComponent(next)}` : ''}`);
  }

  async function onReset() {
    if (!email) {
      setError('パスワード再設定のため、メールアドレスを入力してください。');
      return;
    }
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=password` });
    setResetSent(true);
    setError('');
  }

  return (
    <div className="card">
      <h1 style={{ marginTop: 0, fontSize: 24 }}>提携店舗ログイン</h1>
      <form onSubmit={onSubmit} className="form">
        <label htmlFor="email">メールアドレス</label>
        <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="password">パスワード</label>
        <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
        {resetSent && <p className="small">パスワード再設定のメールを送信しました（登録済みの場合）。</p>}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? '確認中…' : 'ログイン'}
        </button>
        <button className="btn btn-line" type="button" onClick={onReset}>
          パスワードを忘れた場合
        </button>
      </form>
      <p className="small muted">ログイン後、認証アプリの確認コード（6桁）を入力します。</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
