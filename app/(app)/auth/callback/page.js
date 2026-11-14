'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '@/lib/supabase/config';
import { useLang } from '@/components/LangProvider';
import { appText } from '@/lib/content/app';

// Landing page for Supabase's standard email links (invitation, password reset).
// Handles both link styles: tokens in the #fragment, or a ?code= to exchange.
export default function AuthCallback() {
  const t = appText(useLang()).callback;
  const [message, setMessage] = useState(t.checking);

  useEffect(() => {
    (async () => {
      const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { detectSessionInUrl: false } });
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const query = new URLSearchParams(window.location.search);
      // Remove tokens from the address bar and history straight away.
      window.history.replaceState(null, '', '/auth/callback');

      const failed = () => setMessage(t.failed);
      if (hash.get('error_description') || query.get('error_description')) return failed();

      let type = hash.get('type') || query.get('type') || query.get('next');
      if (hash.get('access_token') && hash.get('refresh_token')) {
        const { error } = await supabase.auth.setSession({ access_token: hash.get('access_token'), refresh_token: hash.get('refresh_token') });
        if (error) return failed();
      } else if (query.get('code')) {
        const { error } = await supabase.auth.exchangeCodeForSession(query.get('code'));
        if (error) {
          if (/code verifier|code_verifier/i.test(error.message || '')) {
            return setMessage(t.sameBrowser);
          }
          return failed();
        }
        type = type || 'recovery';
      } else {
        return failed();
      }
      window.location.replace(type === 'invite' || type === 'recovery' || type === 'password' ? '/login/password' : '/login/mfa');
    })();
  }, []);

  return (
    <section className="wrap section" style={{ maxWidth: 520 }}>
      <div className="card">
        <p style={{ margin: 0 }}>{message}</p>
      </div>
    </section>
  );
}
