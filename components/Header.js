import Link from 'next/link';
import Image from 'next/image';
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
      </div>
    </header>
    <nav className="toolbar" aria-label={c.nav.mainMenu}>
      <div className="wrap toolbar-inner">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            {l.label}
          </Link>
        ))}
        <a className="toolbar-login" href={lang === 'ja' ? '/login' : `/login?lang=${lang}`}>
          {c.nav.login}
        </a>
      </div>
    </nav>
    </>
  );
}
