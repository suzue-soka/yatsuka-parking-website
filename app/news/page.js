import Link from 'next/link';
import { sortedNews, formatNewsDate } from '@/lib/news';

export const metadata = {
  title: 'お知らせ',
  description: '谷塚駅東口共同駐車場からの工事・メンテナンス・料金改定などのお知らせです。',
  alternates: { canonical: '/news' },
};

export default function NewsIndex() {
  const news = sortedNews();
  return (
    <section className="wrap section">
      <div className="section-head">
        <p className="kicker">NEWS</p>
        <h1 style={{ margin: '4px 0 0', fontSize: 28 }}>お知らせ</h1>
      </div>
      <ul className="news-list">
        {news.map((n) => (
          <li key={n.slug}>
            <Link href={`/news/${n.slug}`}>
              <span className="num small muted">{formatNewsDate(n.date)}</span>
              <span className={`badge ${n.category}`}>{n.category}</span>
              <span>{n.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
