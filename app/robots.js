import { SITE } from '@/lib/site';

export default function robots() {
  const base = SITE.url.replace(/\/$/, '');
  // Only the production deployment on the real domain is indexed; previews are hidden.
  const indexable = process.env.VERCEL_ENV === 'production' && process.env.ALLOW_INDEXING === 'true';
  return {
    rules: indexable ? [{ userAgent: '*', allow: '/', disallow: ['/portal', '/admin', '/api'] }] : [{ userAgent: '*', disallow: '/' }],
    sitemap: `${base}/sitemap.xml`,
  };
}
