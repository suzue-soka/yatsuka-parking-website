'use client';

import PasswordInput from '@/components/PasswordInput';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createClient as createPlainClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/lib/supabase/config';
import { useLang } from '@/components/LangProvider';
import { appText } from '@/lib/content/app';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const t = appText(useLang()).login;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(params.get('error') === 'link' ? t.linkError : '');
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
      setError(t.wrong);
      return;
    }
    const next = params.get('next');
    router.replace(`/login/mfa${next ? `?next=${encodeURIComponent(next)}` : ''}`);
  }

  async function onReset() {
    if (!email) {
      setError(t.needEmail);
      return;
    }
    // Implicit-flow client: the emailed link then works in any browser or device,
    // not only the one where the reset was requested (PKCE needs the same browser).
    const supabase = createPlainClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { flowType: 'implicit', persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=password` });
    if (resetError && resetError.status === 429) {
      setError(t.rateLimit);
      return;
    }
    setResetSent(true);
    setError('');
  }

  return (
    <div className="card">
      <h1 style={{ marginTop: 0, fontSize: 24 }}>{t.title}</h1>
      <form onSubmit={onSubmit} className="form">
        <label htmlFor="email">{t.email}</label>
        <input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="password">{t.password}</label>
        <PasswordInput id="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
        {resetSent && <p className="small">{t.resetSent}</p>}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? t.checking : t.submit}
        </button>
        <button className="btn btn-line" type="button" onClick={onReset}>
          {t.forgot}
        </button>
      </form>
      <p className="small muted">{t.mfaHint}</p>
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
