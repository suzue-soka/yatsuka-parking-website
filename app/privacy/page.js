import { SITE } from '@/lib/site';

export const metadata = {
  title: 'プライバシーポリシー',
  alternates: { canonical: '/privacy' },
  robots: { index: false },
};

// Placeholder until the lawyer-reviewed policy is ready.
export default function Privacy() {
  return (
    <section className="wrap section prose">
      <h1 style={{ fontSize: 28 }}>プライバシーポリシー</h1>
      <p>プライバシーポリシーは現在準備中です。公開までしばらくお待ちください。</p>
      <p>
        個人情報の取扱いに関するお問い合わせは、{SITE.owner.name}（TEL <a href={SITE.owner.telHref}>{SITE.owner.tel}</a>）までご連絡ください。
      </p>
    </section>
  );
}
