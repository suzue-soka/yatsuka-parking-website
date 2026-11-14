'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Two-step verification with an authenticator app (TOTP).
// First visit: register the app by scanning the QR code. Afterwards: enter the 6-digit code.
function Mfa() {
  const router = useRouter();
  const params = useSearchParams();
  const [state, setState] = useState({ loading: true });
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: claimsData } = await supabase.auth.getClaims();
      if (!claimsData?.claims) return router.replace('/login');
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = (data?.totp || []).find((f) => f.status === 'verified');
      if (verified) return setState({ factorId: verified.id, enrolled: true });
      // Remove half-finished registrations, then start a new one.
      for (const f of data?.all || []) {
        if (f.factor_type === 'totp' && f.status !== 'verified') await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data: en, error: enErr } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: '認証アプリ' });
      if (enErr) return setState({ failed: true });
      setState({ factorId: en.id, enrolled: false, qr: en.totp.qr_code, secret: en.totp.secret });
    })();
  }, [router]);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId: state.factorId, code: code.trim() });
    setBusy(false);
    if (err) return setError('確認コードが正しくありません。アプリに表示されている最新のコードを入力してください。');
    const next = params.get('next');
    router.replace(next && next.startsWith('/') && !next.startsWith('//') ? next : '/portal');
    router.refresh();
  }

  if (state.loading) return <p>読み込み中…</p>;
  if (state.failed) return <p className="alert">二段階認証の準備ができませんでした。もう一度ログインしてください。</p>;

  return (
    <div className="card">
      <h1 style={{ marginTop: 0, fontSize: 24 }}>二段階認証</h1>
      {!state.enrolled && (
        <>
          <p>
            スマートフォンの認証アプリ（Google Authenticator、Microsoft Authenticator など）で、下のQRコードを読み取ってください。
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={state.qr} alt="認証アプリ登録用のQRコード" width={200} height={200} style={{ background: '#fff', padding: 8, borderRadius: 8 }} />
          <p className="small muted">
            読み取れない場合は、次のキーを手入力してください：<br />
            <code style={{ wordBreak: 'break-all' }}>{state.secret}</code>
          </p>
        </>
      )}
      <form onSubmit={onSubmit} className="form">
        <label htmlFor="code">認証アプリに表示された6桁のコード</label>
        <input id="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value)} />
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {state.enrolled ? '確認' : '登録して確認'}
        </button>
      </form>
    </div>
  );
}

export default function MfaPage() {
  return (
    <Suspense>
      <Mfa />
    </Suspense>
  );
}
