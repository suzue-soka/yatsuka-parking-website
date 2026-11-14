import Link from 'next/link';
import { notFound } from 'next/navigation';
import { NEWS, findNews, formatNewsDate } from '@/lib/news';

export const dynamicParams = false;

export function generateStaticParams() {
  return NEWS.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const item = findNews(slug);
  if (!item) return {};
  return {
    title: item.title,
    description: item.body[0],
    alternates: { canonical: `/news/${item.slug}` },
  };
}

export default async function NewsArticle({ params }) {
  const { slug } = await params;
  const item = findNews(slug);
  if (!item) notFound();

  return (
    <article className="wrap section prose">
      <p className="small">
        <Link href="/news">← お知らせ一覧</Link>
      </p>
      <p className="small">
        <span className="num muted">{formatNewsDate(item.date)}</span> <span className={`badge ${item.category}`}>{item.category}</span>
      </p>
      <h1 style={{ fontSize: 26 }}>{item.title}</h1>
      {item.body.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </article>
  );
}
