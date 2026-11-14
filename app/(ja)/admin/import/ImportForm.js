'use client';

import { useActionState } from 'react';
import { importCsv } from './actions';

export default function ImportForm() {
  const [state, action, pending] = useActionState(importCsv, null);

  return (
    <div className="card">
      <form action={action} className="form">
        <label htmlFor="file">ParkingWeb「掛売割引利用明細」CSV（出力形式：割引毎の精算単位）</label>
        <input id="file" name="file" type="file" accept=".csv,text/csv" required />
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? '取込中…' : '取り込む'}
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
          <p className="ok">取込が完了しました。</p>
          <ul>
            <li>
              対象期間：{state.period?.from?.slice(0, 16).replace('T', ' ')} 〜 {state.period?.to?.slice(0, 16).replace('T', ' ')}
            </li>
            <li>
              ファイルの合計：{state.totalCount}件 / {state.totalYen?.toLocaleString('ja-JP')}円（行数 {state.rows}）
            </li>
            <li>
              新しく追加：<strong>{state.added}件</strong>　既に取込済み：{state.alreadyPresent}件
            </li>
            {state.unknown?.length > 0 && <li className="warn">未登録の店No.：{state.unknown.join('、')}（請求の対象外です。提携店舗に登録してください）</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
