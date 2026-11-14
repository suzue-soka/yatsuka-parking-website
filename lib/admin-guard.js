import { redirect } from 'next/navigation';
import { createClient, getClaims } from '@/lib/supabase/server';

/** Ensures the visitor is a verified (aal2) administrator. Returns { supabase, claims }. */
export async function requireAdmin() {
  const supabase = await createClient();
  const claims = await getClaims(supabase);
  if (!claims) redirect('/login?next=/admin');
  if (claims.aal !== 'aal2') redirect('/login/mfa?next=/admin');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', claims.sub).single();
  if (profile?.role !== 'admin') redirect('/portal');
  return { supabase, claims };
}
