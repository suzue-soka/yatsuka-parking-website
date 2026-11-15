import Link from 'next/link';
import Image from 'next/image';
import { getContent } from '@/lib/content';
import { href } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ToolbarAccount from '@/components/ToolbarAccount';

export default function Header({ lang = 'ja', app = false }) {
  const c = getContent(lang);
  const home = href(lang, '/');
  const anchor = (id) => `${home}#${id}`;
  const links = [
    { href: anchor('rates'), label: c.nav.rates },
    { href: anchor('calc'), label: c.nav.calc },
    { href: anchor('access'), label: c.nav.access },
    { href: anchor('monthly'), label: c.nav.monthly },
    { href: href(lang, '/partners'), label: c.nav.partners },
    { href: anchor('support'), label: c.nav.support },
  ];

  return (
    <>
    <LanguageSwitcher lang={lang} label={c.nav.language} app={app} />
    <header className="header">
      <div className="wrap header-inner">
        <Link href={home} className="brand" aria-label={`${c.name} ${c.nav.toTop}`}>
          <Image className="brand-logo" src="/images/logo-lockup.svg" alt={c.name} width={249} height={52} priority unoptimized />
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
        <ToolbarAccount lang={lang} labels={{ login: c.nav.login, myPage: c.nav.myPage, admin: c.nav.adminPage }} />
      </div>
    </nav>
    </>
  );
}
