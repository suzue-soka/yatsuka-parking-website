import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ALLOWED = ['invite', 'recovery', 'email', 'magiclink'];

// Email links (invitation, password reset) land here with a one-time token hash.
export async function GET(request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');

  const redirectTo = request.nextUrl.clone();
  redirectTo.search = '';

  if (tokenHash && ALLOWED.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      // Invited users and password resets choose a (new) password first.
      redirectTo.pathname = type === 'invite' || type === 'recovery' ? '/login/password' : '/login/mfa';
      return NextResponse.redirect(redirectTo);
    }
  }
  redirectTo.pathname = '/login';
  redirectTo.searchParams.set('error', 'link');
  return NextResponse.redirect(redirectTo);
}
