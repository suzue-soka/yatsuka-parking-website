import { getAppLang } from '@/lib/app-lang';
import { appText } from '@/lib/content/app';

export async function generateMetadata() {
  return { title: appText(await getAppLang()).login.metaTitle, robots: { index: false, follow: false } };
}

export default function LoginLayout({ children }) {
  return (
    <section className="wrap section" style={{ maxWidth: 520 }}>
      {children}
    </section>
  );
}
