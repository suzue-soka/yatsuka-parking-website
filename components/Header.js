import Link from 'next/link';
import Image from 'next/image';
import { SITE } from '@/lib/site';

const LINKS = [
  { href: '/#rates', label: '料金' },
  { href: '/#calc', label: '料金を計算' },
  { href: '/#access', label: 'アクセス' },
  { href: '/#monthly', label: '月極契約' },
  { href: '/#support', label: 'お困りのときは' },
  { href: '/partners', label: '提携店舗' },
];

export default function Header() {
  return (
    <header className="header">
      <div className="wrap header-inner">
        <Link href="/" className="brand" aria-label={`${SITE.name} トップへ`}>
          <Image className="brand-mark" src="/images/logo-navy.png" alt="" width={29} height={40} priority />
          <Image className="brand-word" src="/images/wordmark-navy.png" alt={SITE.name} width={194} height={28} priority />
        </Link>
        <nav className="nav" aria-label="メインメニュー">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
        <Link className="login-link" href="/login">
          提携店舗ログイン
        </Link>
        <a className="tel-link" href={SITE.owner.telHref}>
          TEL {SITE.owner.tel}
        </a>
        <details className="menu">
          <summary aria-label="メニューを開く">メニュー</summary>
          <nav className="menu-panel" aria-label="メインメニュー（モバイル）">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
            <Link href="/login">提携店舗ログイン</Link>
            <a href={SITE.owner.telHref}>電話する {SITE.owner.tel}</a>
          </nav>
        </details>
      </div>
      <nav className="quick" aria-label="よく使うメニュー">
        <a href="/#rates">料金</a>
        <a href="/#access">アクセス</a>
        <a href="/#monthly">月極契約</a>
      </nav>
    </header>
  );
}
