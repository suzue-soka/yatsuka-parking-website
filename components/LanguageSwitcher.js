'use client';

import { usePathname } from 'next/navigation';
import { LANGS, LANG_META, href, splitPath, isTranslated } from '@/lib/i18n';

// Links to the same page in each language (or that language's home page if
// the current page is Japanese only, such as the partner portal).
export default function LanguageSwitcher({ lang, label }) {
  const pathname = usePathname() || '/';
  const { path } = splitPath(pathname);
  const target = isTranslated(path) ? path : '/';

  return (
    <nav className="langbar" aria-label={label}>
      <div className="wrap langbar-inner">
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
        </svg>
        {LANGS.map((l) => {
          const m = LANG_META[l];
          const current = l === lang;
          return (
            <a
              key={l}
              href={href(l, target)}
              hrefLang={m.hreflang}
              lang={m.htmlLang}
              aria-current={current ? 'true' : undefined}
              className={current ? 'current' : undefined}
            >
              {m.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
