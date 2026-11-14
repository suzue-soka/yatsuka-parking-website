import Link from 'next/link';
import Image from 'next/image';
import { SITE } from '@/lib/site';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div>
          <Image src="/images/wordmark-white.png" alt={SITE.name} width={222} height={32} />
          <p>
            {SITE.address.full}
            <br />
            {SITE.walk}・24時間営業・収容{SITE.capacity}台
          </p>
        </div>
        <div>
          <p>
            <strong>運営</strong>
            <br />
            {SITE.owner.name}
            <br />
            {SITE.owner.address}
            <br />
            TEL <a href={SITE.owner.telHref}>{SITE.owner.tel}</a>
          </p>
        </div>
        <ul>
          <li>
            <Link href="/#rates">料金</Link>
          </li>
          <li>
            <Link href="/#access">アクセス</Link>
          </li>
          <li>
            <Link href="/#monthly">月極駐車場</Link>
          </li>
          <li>
            <Link href="/news">お知らせ</Link>
          </li>
          <li>
            <Link href="/partners">提携店舗のご案内</Link>
          </li>
          <li>
            <Link href="/privacy">プライバシーポリシー</Link>
          </li>
        </ul>
      </div>
      <div className="wrap">
        <p className="small">© {new Date().getFullYear()} {SITE.owner.name}</p>
      </div>
    </footer>
  );
}
