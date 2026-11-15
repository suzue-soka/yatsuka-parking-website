'use client';

import { useEffect, useState } from 'react';

/**
 * Toolbar account button on the public site.
 * Signed out: 「提携店舗ログイン」. Signed in: 「提携店舗ページへ」 (admins: 「管理画面へ」) + 「ログアウト」.
 * Public pages stay static and fast: the check runs in the visitor's browser, and the
 * Supabase code is only loaded when a sign-in cookie exists.
 */
export default function ToolbarAccount({ lang, labels }) {
  const loginHref = lang === 'ja' ? '/login' : `/login?lang=${lang}`;
  const [state, setState] = useState(null); // null = signed out, 'partner' | 'admin'
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!/(^|;\s*)sb-[^=]*-auth-token/.test(document.cookie)) return;
    let alive = true;
    (async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        const user = data?.session?.user;
        if (!user || !alive) return;
        setState('partner');
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
        if (alive && profile?.role === 'admin') setState('admin');
      } catch {
        // stay on the login button
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (state) {
    return (
      <span className="toolbar-account">
        <a className="toolbar-login" href={state === 'admin' ? '/admin' : '/portal'}>
          {state === 'admin' ? labels.admin : labels.myPage}
        </a>
        <form action="/auth/signout" method="post" onSubmit={() => setLeaving(true)}>
          <button type="submit" className="toolbar-logout" disabled={leaving} aria-busy={leaving}>
            {labels.logout}
          </button>
        </form>
      </span>
    );
  }
  return (
    <span className="toolbar-account">
      <a className="toolbar-login" href={loginHref}>
        {labels.login}
      </a>
    </span>
  );
}
