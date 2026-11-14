// Languages of the public site. Japanese stays at the unprefixed URLs.
export const LANGS = ['ja', 'en', 'zh'];

export const LANG_META = {
  ja: { htmlLang: 'ja', label: '日本語', short: 'JA', prefix: '', ogLocale: 'ja_JP', hreflang: 'ja' },
  en: { htmlLang: 'en', label: 'English', short: 'EN', prefix: '/en', ogLocale: 'en_US', hreflang: 'en' },
  zh: { htmlLang: 'zh-Hans', label: '简体中文', short: '中文', prefix: '/zh', ogLocale: 'zh_CN', hreflang: 'zh-Hans' },
};

// Pages that exist in every language. Others (portal, login, admin) are Japanese only.
const TRANSLATED = [/^\/$/, /^\/news$/, /^\/news\/[\w-]+$/, /^\/partners$/, /^\/partners\/terms$/, /^\/privacy$/];

// Build a path for a language: href('en', '/news') -> '/en/news'
export function href(lang, path = '/') {
  const prefix = LANG_META[lang]?.prefix ?? '';
  if (!prefix) return path;
  return path === '/' ? prefix : `${prefix}${path}`;
}

// Split '/en/news' into { lang: 'en', path: '/news' }
export function splitPath(pathname = '/') {
  for (const lang of ['en', 'zh']) {
    const p = LANG_META[lang].prefix;
    if (pathname === p) return { lang, path: '/' };
    if (pathname.startsWith(`${p}/`)) return { lang, path: pathname.slice(p.length) };
  }
  return { lang: 'ja', path: pathname || '/' };
}

export function isTranslated(path) {
  return TRANSLATED.some((re) => re.test(path));
}

// Metadata alternates for a page that exists in all languages.
export function alternates(lang, path = '/') {
  const languages = {};
  for (const l of LANGS) languages[LANG_META[l].hreflang] = href(l, path);
  languages['x-default'] = href('ja', path);
  return { canonical: href(lang, path), languages };
}
