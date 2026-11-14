'use client';

import { useEffect } from 'react';

// Supabase's standard invitation email returns to the site's home page with the
// session in the #fragment. Forward such visits to /auth/callback to finish signing in.
export default function AuthLinkForwarder() {
  useEffect(() => {
    const { hash, search, pathname } = window.location;
    if (pathname.startsWith('/auth/')) return;
    if (/access_token=|error_description=/.test(hash) || /[?&]code=/.test(search)) {
      window.location.replace(`/auth/callback${search}${hash}`);
    }
  }, []);
  return null;
}
