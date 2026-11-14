import { Inter, Noto_Sans_JP } from 'next/font/google';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SITE } from '@/lib/site';
import './globals.css';

const noto = Noto_Sans_JP({ subsets: ['latin'], weight: ['400', '500', '700'], display: 'swap', variable: '--font-noto' });
const inter = Inter({ subsets: ['latin'], weight: ['400', '600', '700'], display: 'swap', variable: '--font-inter' });

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: '谷塚駅の駐車場・月極駐車場｜谷塚駅東口共同駐車場',
    template: '%s｜谷塚駅東口共同駐車場',
  },
  description: SITE.description,
  applicationName: SITE.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: SITE.name,
    title: '谷塚駅の駐車場・月極駐車場｜谷塚駅東口共同駐車場',
    description: SITE.description,
    images: [{ url: '/images/front.jpg', width: 1600, height: 900, alt: '谷塚駅東口共同駐車場の外観' }],
  },
  icons: { icon: '/images/logo-navy.png', apple: '/images/logo-navy.png' },
  formatDetection: { telephone: false },
};

export const viewport = {
  themeColor: '#003870',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja" className={`${noto.variable} ${inter.variable}`}>
      <body>
        <a className="skip" href="#main">
          本文へスキップ
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
