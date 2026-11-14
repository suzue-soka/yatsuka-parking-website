import { NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';
import { LANG_COOKIE, LANG_MAX_AGE, isLang } from '@/lib/lang';

export async function proxy(request) {
  // "/login?lang=en" (link from the English or Chinese site): remember the language, then drop the parameter.
  const lang = request.nextUrl.searchParams.get('lang');
  if (lang !== null) {
    const url = request.nextUrl.clone();
    url.searchParams.delete('lang');
    const r = NextResponse.redirect(url);
    if (isLang(lang)) r.cookies.set(LANG_COOKIE, lang, { path: '/', maxAge: LANG_MAX_AGE, sameSite: 'lax', secure: url.protocol === 'https:' });
    return r;
  }
  return updateSession(request);
}

export const config = {
  // Only the pages that use sign-in; the public site is untouched.
  matcher: ['/portal/:path*', '/admin/:path*', '/login/:path*', '/login', '/auth/:path*'],
};
