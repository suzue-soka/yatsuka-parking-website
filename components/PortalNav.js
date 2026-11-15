'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Page buttons in the partner / admin header; the current page is shown in orange.
 *  The longest matching link wins, so /admin/partners/… highlights "Partners", not "Admin". */
export default function PortalNav({ links }) {
  let path = usePathname() || '';
  // 納品書 pages belong to 認証機; invoice pages to the dashboard (請求書 is shown there).
  if (/^\/portal\/machines(\/|$)/.test(path)) path = '/portal/billing';
  else if (/^\/portal\/invoices(\/|$)/.test(path)) path = '/portal';
  const match = (h) => path === h || path.startsWith(`${h}/`);
  const current = links.filter((l) => match(l.href)).sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {links.map((l) => (
        <Link
          key={l.href}
          className={`btn btn-ghost${l.href === current ? ' is-current' : ''}`}
          href={l.href}
          aria-current={l.href === current ? 'page' : undefined}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
