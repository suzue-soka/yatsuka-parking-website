'use client';

import { useEffect } from 'react';

/** Scrolls to the element named in the address (#id) once the page has rendered — the browser's own
 *  jump does not happen when the content arrives after a loading screen or a form redirect. */
export default function ScrollToHash({ token }) {
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const el = document.getElementById(decodeURIComponent(id));
    if (el) el.scrollIntoView({ block: 'start' });
  }, [token]);
  return null;
}
