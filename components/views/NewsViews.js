import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getContent } from '@/lib/content';
import { href } from '@/lib/i18n';
import { sortedNews, findNews, formatNewsDate } from '@/lib/news';

export function NewsIndexView({ lang = 'ja' }) {
  const c = getContent(lang);
  const news = sortedNews(lang);
  return (
    <section className="wrap section">
      <div className="section-head">
        <p className="kicker">NEWS</p>
        <h1 style={{ margin: '4px 0 0', fontSize: 28 }}>{c.news.title}</h1>
      </div>
      <ul className="news-list">
        {news.map((n) => (
          <li key={n.slug}>
            <Link href={href(lang, `/news/${n.slug}`)}>
              <span className="num small muted">{formatNewsDate(n.date)}</span>
              <span className={`badge ${n.category}`}>{c.news.categories[n.category] || n.category}</span>
              <span>{n.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function NewsArticleView({ lang = 'ja', slug }) {
  const c = getContent(lang);
  const item = findNews(slug, lang);
  if (!item) notFound();
  return (
    <article className="wrap section">
      {/* Text column starts at the same left edge as the news list; .prose only limits the line length */}
      <div className="prose">
      <p className="small">
        <Link href={href(lang, '/news')}>{c.news.back}</Link>
      </p>
      <p className="small">
        <span className="num muted">{formatNewsDate(item.date)}</span>{' '}
        <span className={`badge ${item.category}`}>{c.news.categories[item.category] || item.category}</span>
      </p>
      <h1 style={{ fontSize: 26 }}>{item.title}</h1>
      {item.body.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      {c.news.translationNote && <p className="small muted">{c.news.translationNote}</p>}
      </div>
    </article>
  );
}

export function newsIndexMetadata(lang) {
  const c = getContent(lang);
  return { title: c.news.title, description: c.news.metaDesc };
}

export function newsArticleMetadata(lang, slug) {
  const item = findNews(slug, lang);
  if (!item) return {};
  return { title: item.title, description: item.body[0] };
}
