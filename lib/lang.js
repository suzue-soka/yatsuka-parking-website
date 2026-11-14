// The display language a visitor last chose, kept in a cookie for a year.
export const LANG_COOKIE = 'lang';
export const LANG_MAX_AGE = 60 * 60 * 24 * 365;

export function isLang(v) {
  return v === 'ja' || v === 'en' || v === 'zh';
}

// Browser only: remember the choice.
export function rememberLang(lang) {
  if (!isLang(lang)) return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${LANG_COOKIE}=${lang}; Path=/; Max-Age=${LANG_MAX_AGE}; SameSite=Lax${secure}`;
}

// Browser only: the remembered choice, or null.
export function readLangCookie() {
  const m = document.cookie.match(/(?:^|;\s*)lang=(ja|en|zh)(?:;|$)/);
  return m ? m[1] : null;
}
