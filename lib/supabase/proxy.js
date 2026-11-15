import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config';
import { IDLE_COOKIE, IDLE_MS } from '@/lib/idle';

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
  const secure = request.nextUrl.protocol === 'https:';

  // Inactivity: signed in but nothing happened for 30 minutes → sign out on this device.
  // (/auth/* is excluded: the invitation and password links must always work.)
  const seen = Number(request.cookies.get(IDLE_COOKIE)?.value || 0);
  if (claims && !path.startsWith('/auth/')) {
    if (seen && Date.now() - seen > IDLE_MS) {
      await supabase.auth.signOut({ scope: 'local' });
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      const next = PROTECTED.some((p) => path === p || path.startsWith(`${p}/`)) ? path : request.nextUrl.searchParams.get('next');
      url.search = `?timeout=1${next ? `&next=${encodeURIComponent(next)}` : ''}`;
      const r = NextResponse.redirect(url);
      response.cookies.getAll().forEach((c) => r.cookies.set(c));
      r.cookies.delete(IDLE_COOKIE);
      return r;
    }
  }
  if (claims) {
    response.cookies.set(IDLE_COOKIE, String(Date.now()), { path: '/', sameSite: 'lax', secure, maxAge: 60 * 60 * 24 });
  } else if (seen) {
    response.cookies.delete(IDLE_COOKIE);
  }

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
