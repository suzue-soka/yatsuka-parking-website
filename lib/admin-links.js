import { appText } from '@/lib/content/app';
import { onbText } from '@/lib/content/onboarding';

// Header links shared by every admin screen.
export function adminLinks(lang) {
  const a = appText(lang).admin;
  const o = onbText(lang).admin;
  return [
    { href: '/admin', label: a.title },
    { href: '/admin/partners', label: o.partners },
    { href: '/admin/requests', label: o.requests },
    { href: '/admin/import', label: a.importLink },
  ];
}
