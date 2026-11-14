import { updateSession } from '@/lib/supabase/proxy';

export async function proxy(request) {
  return updateSession(request);
}

export const config = {
  // Only the pages that use sign-in; the public site is untouched.
  matcher: ['/portal/:path*', '/admin/:path*', '/login/:path*', '/login', '/auth/:path*'],
};
