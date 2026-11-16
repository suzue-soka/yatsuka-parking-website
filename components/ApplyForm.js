'use client';

import { startTransition, useActionState, useEffect, useState } from 'react';
import { submitApplication } from '@/lib/actions/apply';
import { programText } from '@/lib/content/program';
import { DISCOUNT_TYPES, CATEGORIES, USAGE, USAGE_COUNT, DOC_KINDS, estimateMonthly } from '@/lib/program-data';
import { href } from '@/lib/i18n';
import MachineFields from '@/components/MachineFields';
import { getContent } from '@/lib/content';

function Field({ id, label, req, t, children }) {
  return (
    <>
      <label htmlFor={id}>
        {label} <span className="small muted">（{req ? t.required : t.optional}）</span>
      </label>
      {children}
    </>
  );
}

// Estimated monthly invoice for the chosen usage and discount types (one line per type).
export function Estimate({ usage, picked, t, yen }) {
  const count = USAGE_COUNT[usage];
  if (!count || picked.length === 0) {
    return usage === 'unknown' && picked.length ? <p className="small muted">{t.est.unknown}</p> : null;
  }
  const rows = DISCOUNT_TYPES.filter((d) => picked.includes(d.code)).map((d) => ({ d, e: estimateMonthly(count, d.yen) }));
  return (
    <div className="estimate" role="status" aria-live="polite">
      <strong>{t.est.title}</strong>
      <p className="small" style={{ margin: '2px 0 8px' }}>
        {t.est.basis(count, usage === 'u201+')}
      </p>
      {rows.map(({ d, e }) => (
        <div key={d.code} className="estimate-row">
          <span>
            {(() => {
              const l = d.hours ? t.discountLabel(d.hours) : t.amountLabel(d.yen.toLocaleString('ja-JP'));
              return rows.length > 1 ? t.est.onlyType(l) : l;
            })()}
            <span className="small muted" style={{ display: 'block' }}>
              {t.est.calc(yen(d.yen), e.count, yen(e.gross), e.rate)}
            </span>
          </span>
          <strong className="num">{yen(e.total)}</strong>
        </div>
      ))}
      <p className="small muted" style={{ margin: '8px 0 0' }}>
        {t.est.note}
      </p>
    </div>
  );
}

export default function ApplyForm({ lang = 'ja' }) {
  const t = programText(lang);
  const c = getContent(lang);
  const yen = (n) => c.yen(n.toLocaleString('ja-JP'));
  const [state, action, pending] = useActionState(submitApplication.bind(null, lang), null);
  const [started, setStarted] = useState(0);
  const [picked, setPicked] = useState([]);
  const [usage, setUsage] = useState('');
  useEffect(() => setStarted(Date.now()), []);

  if (state?.ok) {
    return (
      <div className="card" role="status">
        <h2 style={{ marginTop: 0 }}>{t.doneTitle}</h2>
        <p style={{ marginBottom: 0 }}>{t.doneBody}</p>
      </div>
    );
  }

  const terms = t.agreeTerms(t.termsLink);
  const privacy = t.agreePrivacy(t.privacyLink);

  return (
    <form
      className="form card apply-form"
      onSubmit={(e) => {
        // Submitted by hand (not the form action prop) so the entries stay if there is an error.
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="started" value={started} />
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
        <input name="company_url" tabIndex={-1} autoComplete="off" />
      </div>

      <h2>{t.sections.business}</h2>
      <Field id="company" label={t.f.company} req t={t}>
        <input id="company" name="company" required maxLength={200} autoComplete="organization" />
      </Field>
      <Field id="category" label={t.f.category} req t={t}>
        <select id="category" name="category" required defaultValue="">
          <option value="" disabled>
            {t.choose}
          </option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t.categories[c]}
            </option>
          ))}
        </select>
      </Field>
      <Field id="representative" label={t.f.representative} req t={t}>
        <input id="representative" name="representative" required maxLength={200} />
      </Field>
      <Field id="contact" label={t.f.contact} req t={t}>
        <input id="contact" name="contact" required maxLength={200} autoComplete="name" />
      </Field>
      <Field id="address" label={t.f.address} req t={t}>
        <input id="address" name="address" required maxLength={300} autoComplete="street-address" />
      </Field>
      <Field id="phone" label={t.f.phone} req t={t}>
        <input id="phone" name="phone" type="tel" required maxLength={30} autoComplete="tel" />
      </Field>
      <Field id="email" label={t.f.email} req t={t}>
        <input id="email" name="email" type="email" required maxLength={200} autoComplete="email" />
      </Field>
      <Field id="website" label={t.f.website} t={t}>
        <input id="website" name="website" type="url" inputMode="url" maxLength={300} placeholder="https://" />
      </Field>

      <h2>{t.sections.service}</h2>
      <Field id="usage" label={t.f.usage} req t={t}>
        <select id="usage" name="usage" required value={usage} onChange={(e) => setUsage(e.target.value)}>
          <option value="" disabled>
            {t.choose}
          </option>
          {USAGE.map((u) => (
            <option key={u} value={u}>
              {t.usage[u]}
            </option>
          ))}
        </select>
      </Field>
      <h3 className="apply-sub">{t.f.machines}</h3>
      <p className="small muted" style={{ margin: 0 }}>
        {t.machinesHint}
      </p>
      <MachineFields
        labels={{ ...t.mf, discount: t.discountLabel('{h}'), yenFormat: c.yen('{n}') }}
        onChange={(items) => setPicked([...new Set(items.flatMap((m) => m.discounts))])}
      />
      <Estimate usage={usage} picked={picked} t={t} yen={yen} />

      <h2>{t.sections.document}</h2>
      <fieldset>
        <legend>
          {t.f.docKind} <span className="small muted">（{t.required}）</span>
        </legend>
        {DOC_KINDS.map((k) => (
          <label key={k} className="check">
            <input type="radio" name="doc_kind" value={k} required />
            {t.docKinds[k]}
          </label>
        ))}
      </fieldset>
      <Field id="document" label={t.f.docFile} req t={t}>
        <input id="document" name="document" type="file" accept="application/pdf,image/jpeg,image/png" required />
      </Field>

      <h2>
        {t.sections.consent} <span className="small muted">（{t.required}）</span>
      </h2>
      <label className="check">
        <input type="checkbox" name="terms" required />
        <span>
          {terms[0]}
          <a href={href(lang, '/partners/terms')} target="_blank" rel="noopener">
            {terms[1]}
          </a>
          {terms[2]}
        </span>
      </label>
      <label className="check">
        <input type="checkbox" name="privacy" required />
        <span>
          {privacy[0]}
          <a href={href(lang, '/privacy')} target="_blank" rel="noopener">
            {privacy[1]}
          </a>
          {privacy[2]}
        </span>
      </label>
      <label className="check">
        <input type="checkbox" name="antisocial" required />
        <span>{t.antisocial}</span>
      </label>

      <h2>{t.sections.listing}</h2>
      <label className="check">
        <input type="checkbox" name="permission_a" />
        <span>{t.permissionA}</span>
      </label>
      <label className="check">
        <input type="checkbox" name="permission_b" />
        <span>{t.permissionB}</span>
      </label>
      <p className="small muted">{t.listingNote}</p>

      {state?.error && (
        <p className="alert" role="alert">
          {t.errors[state.error] || t.errors.server}
          {state.code ? ` (${state.code})` : ''}
        </p>
      )}
      <button className="btn btn-primary" type="submit" disabled={pending || !started}>
        {pending ? t.sending : t.submit}
      </button>
    </form>
  );
}
