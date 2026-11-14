'use client';

import { useEffect, useState } from 'react';
import { calculateFee, toMinutes, fromMinutes, formatDateTime, formatTime, formatDuration, yen, MAX_DAYS } from '@/lib/fees';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const PRESETS = [
  ['1時間', 60],
  ['3時間', 180],
  ['6時間', 360],
  ['12時間', 720],
  ['24時間', 1440],
];

const ERRORS = {
  invalid: '入庫・出庫の日付を入力してください。',
  order: '出庫予定は入庫予定より後の日時を指定してください。',
  too_long: `計算できるのは${MAX_DAYS}日以内です。長期のご利用は月極駐車場をご検討ください。`,
};

// Today's date in Japan Standard Time
function todayJst() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

function TimeField({ id, label, value, onChange }) {
  return (
    <fieldset>
      <legend>{label}</legend>
      <div className="inputs">
        <label htmlFor={`${id}-date`} className="sr-only">
          {label}の日付
        </label>
        <input id={`${id}-date`} type="date" value={value.date} onChange={(e) => onChange({ ...value, date: e.target.value })} />
        <label htmlFor={`${id}-h`} className="sr-only">
          {label}の時（24時間表記）
        </label>
        <select id={`${id}-h`} value={value.hour} onChange={(e) => onChange({ ...value, hour: e.target.value })}>
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span aria-hidden="true">:</span>
        <label htmlFor={`${id}-m`} className="sr-only">
          {label}の分
        </label>
        <select id={`${id}-m`} value={value.minute} onChange={(e) => onChange({ ...value, minute: e.target.value })}>
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  );
}

export default function FeeCalculator() {
  // Fixed initial values so server and browser render the same HTML; today's date is set after load.
  const [arrive, setArrive] = useState({ date: '2026-01-01', hour: '10', minute: '00' });
  const [leave, setLeave] = useState({ date: '2026-01-01', hour: '13', minute: '30' });

  useEffect(() => {
    const d = todayJst();
    setArrive((v) => ({ ...v, date: d }));
    setLeave((v) => ({ ...v, date: d }));
  }, []);

  const a = toMinutes(arrive.date, arrive.hour, arrive.minute);
  const b = toMinutes(leave.date, leave.hour, leave.minute);
  const r = calculateFee(a, b);

  const addFromArrival = (mins) => {
    if (Number.isNaN(a)) return;
    setLeave(fromMinutes(a + mins));
  };

  return (
    <div className="calc">
      <div className="fields">
        <TimeField id="in" label="入庫予定" value={arrive} onChange={setArrive} />
        <TimeField id="out" label="出庫予定" value={leave} onChange={setLeave} />
      </div>

      <div className="chips">
        <span className="small muted">入庫から</span>
        {PRESETS.map(([label, mins]) => (
          <button key={label} type="button" className="chip" onClick={() => addFromArrival(mins)}>
            {label}
          </button>
        ))}
      </div>

      {r.error ? (
        <p className="alert" role="alert">
          {ERRORS[r.error]}
        </p>
      ) : (
        <div aria-live="polite" className="calc">
          <div className="total">
            <div>
              <div className="small">料金の目安（税込）</div>
              <div className="amount">
                {yen(r.total)}
                <span className="small">円</span>
              </div>
            </div>
            <div className="small right">
              駐車時間 <strong>{formatDuration(r.minutes)}</strong>
              <br />
              {formatDateTime(a)} 〜 {formatDateTime(b)}
            </div>
          </div>

          <div className="grid">
            <div className="subtotal accent">
              <span>
                <strong>昼間料金</strong> <span className="small muted">{formatDuration(r.dayMinutes)}</span>
              </span>
              <strong className="num">{yen(r.day)}円</strong>
            </div>
            <div className="subtotal">
              <span>
                <strong>夜間料金</strong> <span className="small muted">{formatDuration(r.nightMinutes)}</span>
              </span>
              <strong className="num">{yen(r.night)}円</strong>
            </div>
          </div>

          <details className="breakdown">
            <summary>時間帯ごとの内訳（{r.rows.length}件）</summary>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">時間帯</th>
                    <th scope="col">日時</th>
                    <th scope="col" className="right">
                      時間
                    </th>
                    <th scope="col" className="right">
                      料金
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {r.rows.map((row) => (
                    <tr key={`${row.key}-${row.start}`}>
                      <td>
                        <strong>{row.kind}</strong>
                      </td>
                      <td className="num">
                        {formatDateTime(row.start)}〜{Math.floor((row.end - 1) / 1440) > Math.floor(row.start / 1440) ? '翌' : ''}
                        {formatTime(row.end)}
                      </td>
                      <td className="right">{formatDuration(row.minutes)}</td>
                      <td className="right">
                        <strong className="num">{yen(row.yen)}円</strong>{' '}
                        <span className="small muted">{row.capped ? '最大料金適用' : `${row.units}単位`}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}

      <ul className="small muted">
        <li>表示は目安です。実際の料金は精算機の表示が優先されます。</li>
        <li>各時間帯で、単位時間（昼間20分・夜間60分）に満たない端数は切り上げて計算しています。</li>
        <li>最大料金は時間帯ごと（昼間 8:00〜22:00 は1,200円、夜間 22:00〜翌8:00 は600円）に適用しています。</li>
        <li>
          提携店舗のサービス・各種割引は含みません。長期のご利用は<a href="#monthly">月極駐車場</a>もご検討ください。
        </li>
      </ul>
    </div>
  );
}
