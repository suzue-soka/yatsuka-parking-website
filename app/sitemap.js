import { SITE } from '@/lib/site';
import { NEWS } from '@/lib/news';

export default function sitemap() {
  const base = SITE.url.replace(/\/$/, '');
  return [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/partners`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/news`, changeFrequency: 'weekly', priority: 0.6 },
    ...NEWS.map((n) => ({ url: `${base}/news/${n.slug}`, lastModified: n.date, changeFrequency: 'yearly', priority: 0.4 })),
  ];
}
