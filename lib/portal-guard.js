import { redirect } from 'next/navigation';
import { createClient, getClaims } from '@/lib/supabase/server';
import { getAppLang } from '@/lib/app-lang';
import { onbText } from '@/lib/content/onboarding';
import { appText } from '@/lib/content/app';

/** Verified (aal2) partner user. Admins go to /admin. Returns everything a portal page needs. */
export async function requirePartner(next = '/portal') {
  const supabase = await createClient();
  const claims = await getClaims(supabase);
  if (!claims) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (claims.aal !== 'aal2') redirect(`/login/mfa?next=${encodeURIComponent(next)}`);
  const { data: profile } = await supabase.from('profiles').select('role, partner_id').eq('id', claims.sub).single();
  if (profile?.role === 'admin') redirect('/admin');
  const lang = await getAppLang();
  const { data: partner } = profile?.partner_id
    ? await supabase.from('partners').select('*').eq('id', profile.partner_id).single()
    : { data: null };
  return { supabase, claims, partner, lang, T: appText(lang), O: onbText(lang) };
}

export function portalLinks(O) {
  return [
    { href: '/portal', label: O.nav.dashboard },
    { href: '/portal/company', label: O.nav.company },
    { href: '/portal/billing', label: O.nav.billing },
    { href: '/portal/terms', label: O.nav.terms },
    { href: '/portal/guide', label: O.nav.guide },
    { href: '/portal/inquiries', label: O.nav.inquiries },
    { href: '/portal/account', label: O.nav.account },
  ];
}
