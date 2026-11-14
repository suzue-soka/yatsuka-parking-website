import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="wrap section prose">
      <h1 style={{ fontSize: 28 }}>ページが見つかりません</h1>
      <p>お探しのページは移動または削除された可能性があります。</p>
      <p>
        <Link href="/">トップページへ戻る</Link>
      </p>
    </section>
  );
}
