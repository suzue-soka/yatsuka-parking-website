import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config';

const PROTECTED = ['/portal', '/admin'];

export async function updateSession(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers || {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // Do not run code between createServerClient and getClaims().
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  const path = request.nextUrl.pathname;
  if (PROTECTED.some((p) => path === p || path.startsWith(`${p}/`))) {
    const redirectTo = (target) => {
      const url = request.nextUrl.clone();
      url.pathname = target;
      url.search = `?next=${encodeURIComponent(path)}`;
      const r = NextResponse.redirect(url);
      response.cookies.getAll().forEach((c) => r.cookies.set(c));
      return r;
    };
    if (!claims) return redirectTo('/login');
    if (claims.aal !== 'aal2') return redirectTo('/login/mfa');
  }
  return response;
}
