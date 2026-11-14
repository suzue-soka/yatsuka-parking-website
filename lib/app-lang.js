import { cookies } from 'next/headers';
import { LANG_COOKIE, isLang } from '@/lib/lang';

// Language for the sign-in pages, portal and admin: the remembered choice, Japanese by default.
export async function getAppLang() {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(v) ? v : 'ja';
}
