'use client';

import { useEffect, useState } from 'react';
import { useLang } from '@/components/LangProvider';
import { appText } from '@/lib/content/app';
import { IDLE_COOKIE, IDLE_MS, IDLE_WARN_MS, IDLE_ENABLED } from '@/lib/idle';

const readSeen = () => Number((document.cookie.match(new RegExp(`(?:^|;\\s*)${IDLE_COOKIE}=(\\d+)`)) || [])[1] || 0);
const writeSeen = () => {
  const secure = location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `${IDLE_COOKIE}=${Date.now()}; path=/; max-age=86400; samesite=lax${secure}`;
};

/**
 * Partner and admin pages: counts activity on the page (mouse, keyboard, touch, scrolling)
 * as use, warns 2 minutes before the 30-minute limit, then signs out.
 * Shared by all open tabs through the cookie; the server enforces the same limit.
 */
export default function IdleWatch() {
  const t = appText(useLang()).idle;
  const [warn, setWarn] = useState(false);

  useEffect(() => {
    if (!IDLE_ENABLED) return undefined;
    let lastWrite = 0;
    const onActivity = () => {
      const now = Date.now();
      if (now - lastWrite > 30 * 1000) {
        lastWrite = now;
        writeSeen();
      }
    };
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    const check = () => {
      const seen = readSeen();
      if (!seen) return;
      const idle = Date.now() - seen;
      if (idle > IDLE_MS) {
        // The server signs out and shows the login page with an explanation.
        window.location.assign(`/login?timeout=1&next=${encodeURIComponent(location.pathname)}`);
      } else {
        setWarn(idle > IDLE_MS - IDLE_WARN_MS);
      }
    };
    check();
    const timer = setInterval(check, 15 * 1000);
    document.addEventListener('visibilitychange', check);
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      clearInterval(timer);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);

  if (!warn) return null;
  return (
    <div className="idle-warn" role="alert">
      <span>{t.warn}</span>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          writeSeen();
          setWarn(false);
        }}
      >
        {t.stay}
      </button>
    </div>
  );
}
