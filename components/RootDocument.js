import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AuthLinkForwarder from '@/components/AuthLinkForwarder';
import { SITE } from '@/lib/site';
import { getContent } from '@/lib/content';
import { LANG_META, alternates } from '@/lib/i18n';
import { noto, notoSc, inter } from '@/lib/fonts';

// Shared <html> document for the Japanese, English and Chinese root layouts.
export default function RootDocument({ lang, app = false, children }) {
  const c = getContent(lang);
  const font = lang === 'zh' ? notoSc : noto;
  return (
    <html lang={LANG_META[lang].htmlLang} className={`${font.variable} ${inter.variable}`}>
      <body>
        <a className="skip" href="#main">
          {c.meta.skip}
        </a>
        <Header lang={lang} app={app} />
        <main id="main">{children}</main>
        <Footer lang={lang} />
        <AuthLinkForwarder />
      </body>
    </html>
  );
}

export function rootMetadata(lang) {
  const c = getContent(lang);
  return {
    metadataBase: new URL(SITE.url),
    title: { default: c.meta.title, template: c.meta.template },
    description: c.description,
    applicationName: c.name,
    alternates: alternates(lang, '/'),
    openGraph: {
      type: 'website',
      locale: LANG_META[lang].ogLocale,
      siteName: c.name,
      title: c.meta.title,
      description: c.description,
      images: [{ url: '/images/front.jpg', width: 1600, height: 900, alt: c.meta.ogAlt }],
    },
    icons: { icon: '/images/logo-mark.svg', apple: '/images/apple-icon.png' },
    formatDetection: { telephone: false },
  };
}

export const viewport = {
  themeColor: '#003870',
  width: 'device-width',
  initialScale: 1,
};
