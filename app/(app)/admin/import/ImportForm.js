'use client';

import { useActionState } from 'react';
import { importCsv } from './actions';
import { useLang } from '@/components/LangProvider';
import { appText } from '@/lib/content/app';

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
        </div>
      )}
    </div>
  );
}
