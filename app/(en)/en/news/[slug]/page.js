import { NewsArticleView, newsArticleMetadata } from '@/components/views/NewsViews';
import { alternates } from '@/lib/i18n';
import { NEWS } from '@/lib/news';

export const dynamicParams = false;

export function generateStaticParams() {
  return NEWS.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return { ...newsArticleMetadata('en', slug), alternates: alternates('en', `/news/${slug}`) };
}

export default async function Page({ params }) {
  const { slug } = await params;
  return <NewsArticleView lang="en" slug={slug} />;
}
