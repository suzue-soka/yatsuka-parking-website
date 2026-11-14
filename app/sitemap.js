import { SITE } from '@/lib/site';
import { NEWS } from '@/lib/news';
import { LANGS, LANG_META, href } from '@/lib/i18n';

// Every public page in Japanese, English and Chinese, each listing its translations.
export default function sitemap() {
  const base = SITE.url.replace(/\/$/, '');
  const pages = [
    { path: '/', changeFrequency: 'weekly', priority: 1 },
    { path: '/partners', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/news', changeFrequency: 'weekly', priority: 0.6 },
    ...NEWS.map((n) => ({ path: `/news/${n.slug}`, lastModified: n.date, changeFrequency: 'yearly', priority: 0.4 })),
  ];
  const url = (lang, path) => `${base}${href(lang, path) === '/' ? '/' : href(lang, path)}`;
  return pages.flatMap(({ path, ...rest }) => {
    const languages = Object.fromEntries(LANGS.map((l) => [LANG_META[l].hreflang, url(l, path)]));
    return LANGS.map((lang) => ({ url: url(lang, path), ...rest, alternates: { languages } }));
  });
}
