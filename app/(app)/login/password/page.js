'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useLang } from '@/components/LangProvider';
import { appText } from '@/lib/content/app';

export default function SetPassword() {
  const router = useRouter();
  const t = appText(useLang()).password;
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (pw.length < 12) return setError(t.tooShort);
    if (pw !== pw2) return setError(t.mismatch);
    setBusy(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (err) return setError(t.failed);
    router.replace('/login/mfa');
  }

  return (
    <div className="card">
      <h1 style={{ marginTop: 0, fontSize: 24 }}>{t.title}</h1>
      <form onSubmit={onSubmit} className="form">
        <label htmlFor="pw">{t.new}</label>
        <input id="pw" type="password" autoComplete="new-password" required value={pw} onChange={(e) => setPw(e.target.value)} />
        <label htmlFor="pw2">{t.again}</label>
        <input id="pw2" type="password" autoComplete="new-password" required value={pw2} onChange={(e) => setPw2(e.target.value)} />
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {t.submit}
        </button>
      </form>
    </div>
  );
}
