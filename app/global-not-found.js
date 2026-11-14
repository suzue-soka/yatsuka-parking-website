import Link from 'next/link';
import { noto, inter } from '@/lib/fonts';
import { NOT_FOUND_TEXT } from '@/components/views/NotFoundView';
import './globals.css';

export const metadata = { title: 'ページが見つかりません / Page not found / 找不到页面' };

// 404 for any URL that matches no page, shown in all three languages.
export default function GlobalNotFound() {
  return (
    <html lang="ja" className={`${noto.variable} ${inter.variable}`}>
      <body>
        <main id="main" className="wrap section prose">
          {['ja', 'en', 'zh'].map((l) => {
            const t = NOT_FOUND_TEXT[l];
            return (
              <div key={l} lang={l === 'zh' ? 'zh-Hans' : l} style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 24, marginBottom: 4 }}>{t.title}</h1>
                <p style={{ margin: '0 0 4px' }}>{t.body}</p>
                <Link href={t.href}>{t.home}</Link>
              </div>
            );
          })}
        </main>
      </body>
    </html>
  );
}
