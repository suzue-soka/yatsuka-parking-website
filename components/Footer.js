import Link from 'next/link';
import Image from 'next/image';
import { SITE } from '@/lib/site';
import { getContent } from '@/lib/content';
import { href } from '@/lib/i18n';

export default function Footer({ lang = 'ja' }) {
  const c = getContent(lang);
  const home = href(lang, '/');
  const L = c.footer.links;
  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div>
          <Image src="/images/logo-lockup-white.svg" alt={c.name} width={211} height={44} unoptimized />
          <p>
            {c.addressFull}
            <br />
            {c.footer.line}
          </p>
        </div>
        <div>
          <p>
            <strong>{c.footer.operator}</strong>
            <br />
            {c.owner.name}
            <br />
            {c.owner.address}
            <br />
            TEL <a href={SITE.telHref}>{lang === 'ja' ? SITE.tel : SITE.telIntl}</a>
          </p>
        </div>
        <ul>
          <li>
            <Link href={`${home}#rates`}>{L.rates}</Link>
          </li>
          <li>
            <Link href={`${home}#access`}>{L.access}</Link>
          </li>
          <li>
            <Link href={`${home}#monthly`}>{L.monthly}</Link>
          </li>
          <li>
            <Link href={href(lang, '/news')}>{L.news}</Link>
          </li>
          <li>
            <Link href={href(lang, '/partners')}>{L.partners}</Link>
          </li>
          <li>
            <a href={lang === 'ja' ? '/login' : `/login?lang=${lang}`}>{L.login}</a>
          </li>
          <li>
            <Link href={href(lang, '/privacy')}>{L.privacy}</Link>
          </li>
        </ul>
      </div>
      <div className="wrap">
        {c.footer.official && <p className="small">{c.footer.official}</p>}
        <p className="small">© {new Date().getFullYear()} {c.owner.name}</p>
      </div>
    </footer>
  );
}
