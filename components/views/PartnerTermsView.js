import { SITE } from '@/lib/site';
import { programText } from '@/lib/content/program';

// Placeholder until the lawyer-reviewed 約款 is published.
export default function PartnerTermsView({ lang = 'ja' }) {
  const t = programText(lang);
  return (
    <section className="wrap section prose">
      <h1 style={{ fontSize: 28 }}>{t.termsTitle}</h1>
      <p>{t.termsBody}</p>
      <p>
        TEL <a href={SITE.telHref}>{lang === 'ja' ? SITE.tel : SITE.telIntl}</a>
      </p>
    </section>
  );
}
