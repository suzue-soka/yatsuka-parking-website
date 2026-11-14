import Link from 'next/link';

const TEXT = {
  ja: { title: 'ページが見つかりません', body: 'お探しのページは移動または削除された可能性があります。', home: 'トップページへ戻る', href: '/' },
  en: { title: 'Page not found', body: 'The page you are looking for may have been moved or deleted.', home: 'Back to the home page', href: '/en' },
  zh: { title: '找不到页面', body: '您要查找的页面可能已被移动或删除。', home: '返回首页', href: '/zh' },
};

export default function NotFoundView({ lang = 'ja' }) {
  const t = TEXT[lang] || TEXT.ja;
  return (
    <section className="wrap section prose">
      <h1 style={{ fontSize: 28 }}>{t.title}</h1>
      <p>{t.body}</p>
      <p>
        <Link href={t.href}>{t.home}</Link>
      </p>
    </section>
  );
}

export { TEXT as NOT_FOUND_TEXT };
