import { redirect } from 'next/navigation';
import { createClient, getClaims } from '@/lib/supabase/server';
import LoginClient from './LoginClient';

export const dynamic = 'force-dynamic';

const safe = (next) => (next && next.startsWith('/') && !next.startsWith('//') ? next : null);

// Already signed in: skip the login form. Fully verified (2-step done) → straight to the page;
// password done but 2-step pending → the 2-step screen. /portal sends admins on to /admin.
export default async function LoginPage({ searchParams }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const claims = await getClaims(supabase);
  if (claims) {
    const next = safe(sp?.next);
    if (claims.aal === 'aal2') redirect(next || '/portal');
    redirect(`/login/mfa${next ? `?next=${encodeURIComponent(next)}` : ''}`);
  }
  return <LoginClient />;
}
