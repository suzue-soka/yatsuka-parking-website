'use client';

import { useActionState } from 'react';
import { importCsv } from './actions';
import { useLang } from '@/components/LangProvider';
import { appText } from '@/lib/content/app';
import Link from 'next/link';

export default function ImportForm() {
  const [state, action, pending] = useActionState(importCsv, null);
  const t = appText(useLang()).import;

  return (
    <div className="card">
      <form action={action} className="form">
        <label htmlFor="file">{t.file}</label>
        <input id="file" name="file" type="file" accept=".csv,text/csv" required />
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? t.busy : t.submit}
        </button>
      </form>

      {state?.error && (
        <div className="alert" role="alert" style={{ marginTop: 12 }}>
          {state.error}
          {state.problems && (
            <ul className="small">
              {state.problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {state?.ok && (
        <div style={{ marginTop: 12 }} aria-live="polite">
          <p className="ok">{t.done}</p>
          <ul>
            <li>
              {t.period}
              {state.period?.from?.slice(0, 16).replace('T', ' ')} 〜 {state.period?.to?.slice(0, 16).replace('T', ' ')}
            </li>
            <li>
              {t.fileTotal(state.totalCount, state.totalYen?.toLocaleString('ja-JP'), state.rows)}
            </li>
            <li>
              {t.added}
              <strong>{state.added}</strong>　{t.already}
              {state.alreadyPresent}
            </li>
            {state.unknown?.length > 0 && <li className="warn">{t.unknown(state.unknown.join(', '))}</li>}
          </ul>
          {state.billing && state.billing.status !== 'already' && (() => {
            const b = state.billing;
            const B = t.billing;
            const m = b.month ? `${Number(b.month.slice(0, 4))}/${Number(b.month.slice(5, 7))}` : '';
            const msg =
              b.status === 'error' ? B.error(b.error) :
              b.status === 'incomplete' ? B.incomplete(m) :
              !b.count ? B.none(m) :
              b.status === 'published' ? B.published(m, b.count) : B.drafted(m, b.count);
            return (
              <div className={b.status === 'error' || b.status === 'incomplete' ? 'alert' : 'ok'} style={{ marginTop: 8 }}>
                <p style={{ margin: 0 }}>{msg}</p>
                {b.mailErrors?.length > 0 && <p className="small" style={{ margin: '4px 0 0' }}>{B.mailErrors(b.mailErrors.join('、'))}</p>}
                {b.error && b.status === 'published' && <p className="small" style={{ margin: '4px 0 0' }}>{B.error(b.error)}</p>}
                {b.status !== 'incomplete' && (
                  <p style={{ margin: '6px 0 0' }}>
                    <Link href="/admin/billing">{B.open}</Link>
                  </p>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
