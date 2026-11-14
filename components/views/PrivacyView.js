import { SITE } from '@/lib/site';
import { getContent } from '@/lib/content';

// Placeholder until the lawyer-reviewed policy is ready.
export default function PrivacyView({ lang = 'ja' }) {
  const c = getContent(lang);
  const [before, , after] = c.privacy.contact(c.owner.name, '');
  return (
    <section className="wrap section prose">
      <h1 style={{ fontSize: 28 }}>{c.privacy.title}</h1>
      <p>{c.privacy.body}</p>
      <p>
        {before}
        <a href={SITE.telHref}>{lang === 'ja' ? SITE.tel : SITE.telIntl}</a>
        {after}
      </p>
    </section>
  );
}
