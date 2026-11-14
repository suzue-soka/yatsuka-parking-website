import RootDocument, { rootMetadata, viewport as baseViewport } from '@/components/RootDocument';
import { LangProvider } from '@/components/LangProvider';
import { getAppLang } from '@/lib/app-lang';
import '../globals.css';

// Sign-in pages, partner portal and admin: one set of URLs, shown in the language
// the user last chose (cookie, and their profile once signed in).
export async function generateMetadata() {
  const lang = await getAppLang();
  return { ...rootMetadata(lang), alternates: undefined, robots: { index: false, follow: false } };
}
export const viewport = baseViewport;

export default async function AppLayout({ children }) {
  const lang = await getAppLang();
  return (
    <RootDocument lang={lang} app>
      <LangProvider lang={lang}>{children}</LangProvider>
    </RootDocument>
  );
}
