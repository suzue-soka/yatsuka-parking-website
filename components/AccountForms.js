'use client';

import PasswordInput from '@/components/PasswordInput';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLang } from '@/components/LangProvider';
import { onbText } from '@/lib/content/onboarding';
import { appText } from '@/lib/content/app';

// Change login email or password (signed-in user, two-step verified).
export default function AccountForms({ email }) {
  const lang = useLang();
  const A = onbText(lang).account;
  const P = appText(lang).password;
  const [msg, setMsg] = useState({});
  const [busy, setBusy] = useState(false);

  async function changeEmail(e) {
    e.preventDefault();
    const next = new FormData(e.currentTarget).get('email');
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ email: next }, { emailRedirectTo: `${window.location.origin}/auth/callback?next=email` });
    setBusy(false);
    setMsg({ email: error ? { err: error.message } : { ok: A.emailSent } });
  }

  async function changePassword(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const pw = String(fd.get('pw'));
    if (pw.length < 12) return setMsg({ pw: { err: P.tooShort } });
    if (pw !== fd.get('pw2')) return setMsg({ pw: { err: P.mismatch } });
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password: pw });
    setBusy(false);
    if (!error) e.currentTarget?.reset?.();
    setMsg({ pw: error ? { err: error.message } : { ok: A.pwDone } });
  }

  const Msg = ({ m }) => (m ? <p className={m.ok ? 'ok' : 'alert'} role={m.err ? 'alert' : 'status'}>{m.ok || m.err}</p> : null);

  return (
    <div className="grid" style={{ alignItems: 'start' }}>
      <form className="card form" onSubmit={changeEmail}>
        <h2 style={{ marginTop: 0, fontSize: 20 }}>{A.changeEmail}</h2>
        <p className="small muted" style={{ margin: 0 }}>
          {A.email}：{email}
        </p>
        <label htmlFor="new-email">{A.newEmail}</label>
        <input id="new-email" name="email" type="email" required autoComplete="email" />
        <Msg m={msg.email} />
        <button className="btn btn-line" type="submit" disabled={busy}>
          {A.changeEmail}
        </button>
      </form>
      <form className="card form" onSubmit={changePassword}>
        <h2 style={{ marginTop: 0, fontSize: 20 }}>{A.changePw}</h2>
        <label htmlFor="pw">{A.newPw}</label>
        <PasswordInput id="pw" name="pw" required autoComplete="new-password" />
        <label htmlFor="pw2">{A.newPw2}</label>
        <PasswordInput id="pw2" name="pw2" required autoComplete="new-password" />
        <Msg m={msg.pw} />
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {A.changePw}
        </button>
      </form>
    </div>
  );
}
