'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLang } from '@/components/LangProvider';
import { appText } from '@/lib/content/app';
import { readLangCookie, rememberLang } from '@/lib/lang';

// Two-step verification with an authenticator app (TOTP).
// First visit: register the app by scanning the QR code. Afterwards: enter the 6-digit code.
function Mfa() {
  const router = useRouter();
  const params = useSearchParams();
  const t = appText(useLang()).mfa;
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
      const { data: en, error: enErr } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: t.appName });
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
    if (err) {
      setBusy(false);
      return setError(t.wrong);
    }
    // Language: the one shown on this device's login screen is saved to the profile;
    // on a new device (no choice yet) the profile's language is used.
    try {
      const chosen = readLangCookie();
      if (chosen) {
        await supabase.rpc('set_my_lang', { p_lang: chosen });
      } else {
        const { data: c } = await supabase.auth.getClaims();
        const { data: p } = await supabase.from('profiles').select('preferred_lang').eq('id', c?.claims?.sub).single();
        if (p?.preferred_lang) rememberLang(p.preferred_lang);
      }
    } catch {
      // Language is a convenience; never block sign-in on it.
    }
    const next = params.get('next');
    // Full load so the pages render in the remembered language.
    window.location.assign(next && next.startsWith('/') && !next.startsWith('//') ? next : '/portal');
  }

  if (state.loading) return <p>{t.loading}</p>;
  if (state.failed) return <p className="alert">{t.failed}</p>;

  return (
    <div className="card">
      <h1 style={{ marginTop: 0, fontSize: 24 }}>{t.title}</h1>
      {!state.enrolled && (
        <>
          <p>{t.scan}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={state.qr} alt={t.qrAlt} width={200} height={200} style={{ background: '#fff', padding: 8, borderRadius: 8 }} />
          <p className="small muted">
            {t.manual}
            <br />
            <code style={{ wordBreak: 'break-all' }}>{state.secret}</code>
          </p>
        </>
      )}
      <form onSubmit={onSubmit} className="form">
        <label htmlFor="code">{t.code}</label>
        <input id="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value)} />
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {state.enrolled ? t.verify : t.enrollVerify}
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
