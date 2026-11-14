import Link from 'next/link';
import Image from 'next/image';
import { SITE } from '@/lib/site';
import { getContent } from '@/lib/content';
import { href } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Header({ lang = 'ja', app = false }) {
  const c = getContent(lang);
  const home = href(lang, '/');
  const anchor = (id) => `${home}#${id}`;
  const links = [
    { href: anchor('rates'), label: c.nav.rates },
    { href: anchor('calc'), label: c.nav.calc },
    { href: anchor('access'), label: c.nav.access },
    { href: anchor('monthly'), label: c.nav.monthly },
    { href: anchor('support'), label: c.nav.support },
    { href: href(lang, '/partners'), label: c.nav.partners },
  ];

  return (
    <>
    <LanguageSwitcher lang={lang} label={c.nav.language} app={app} />
    <header className="header">
      <div className="wrap header-inner">
        <Link href={home} className="brand" aria-label={`${c.name} ${c.nav.toTop}`}>
          <Image className="brand-mark" src="/images/logo-navy.png" alt="" width={29} height={40} priority />
          <Image className="brand-word" src="/images/wordmark-navy.png" alt={c.name} width={194} height={28} priority />
        </Link>
        <nav className="nav" aria-label={c.nav.mainMenu}>
          {links.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
        <a className="login-link" href={lang === 'ja' ? '/login' : `/login?lang=${lang}`}>
          {c.nav.login}
        </a>
        <a className="tel-link" href={SITE.telHref}>
          TEL {SITE.tel}
        </a>
        <details className="menu">
          <summary aria-label={c.nav.menuOpen}>{c.nav.menu}</summary>
          <nav className="menu-panel" aria-label={c.nav.mainMenuMobile}>
            {links.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
            <a href={lang === 'ja' ? '/login' : `/login?lang=${lang}`}>{c.nav.login}</a>
            <a href={SITE.telHref}>
              {c.nav.call} {SITE.tel}
            </a>
          </nav>
        </details>
      </div>
      <nav className="quick" aria-label={c.nav.quick}>
        <a href={anchor('rates')}>{c.nav.rates}</a>
        <a href={anchor('access')}>{c.nav.access}</a>
        <a href={anchor('monthly')}>{c.nav.monthly}</a>
      </nav>
    </header>
    </>
  );
}
