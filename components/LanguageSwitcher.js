'use client';

import { usePathname } from 'next/navigation';
import { LANGS, LANG_META, href, splitPath, isTranslated } from '@/lib/i18n';
import { rememberLang } from '@/lib/lang';

// Public pages: links to the same page in each language.
// Sign-in, portal and admin pages (app): the same page is reloaded in the chosen language.
// Either way the choice is remembered (cookie; and the user's profile when signed in).
export default function LanguageSwitcher({ lang, label, app = false }) {
  const pathname = usePathname() || '/';
  const { path } = splitPath(pathname);
  const target = isTranslated(path) ? path : '/';

  async function choose(e, l) {
    rememberLang(l);
    if (!app) return; // normal link navigation
    e.preventDefault();
    if (l !== lang) {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data } = await supabase.auth.getClaims();
        if (data?.claims) await supabase.rpc('set_my_lang', { p_lang: l });
      } catch {
        // Not signed in or offline: the cookie alone keeps the choice.
      }
    }
    window.location.reload();
  }

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
              href={app ? pathname : href(l, target)}
              hrefLang={m.hreflang}
              lang={m.htmlLang}
              aria-current={current ? 'true' : undefined}
              className={current ? 'current' : undefined}
              onClick={(e) => choose(e, l)}
            >
              {m.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
