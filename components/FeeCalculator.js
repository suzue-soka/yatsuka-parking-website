'use client';

import { useEffect, useState } from 'react';
import { calculateFee, toMinutes, fromMinutes, formatDateTime, formatTime, formatDuration, yen, MAX_DAYS } from '@/lib/fees';
import { getContent } from '@/lib/content';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const PRESET_HOURS = [1, 3, 6, 12, 24];

// Today's date in Japan Standard Time
function todayJst() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

function TimeField({ id, label, value, onChange, t }) {
  return (
    <fieldset>
      <legend>{label}</legend>
      <div className="inputs">
        <label htmlFor={`${id}-date`} className="sr-only">
          {t.date(label)}
        </label>
        <input id={`${id}-date`} type="date" value={value.date} onChange={(e) => onChange({ ...value, date: e.target.value })} />
        <label htmlFor={`${id}-h`} className="sr-only">
          {t.hour(label)}
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
          {t.minute(label)}
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

export default function FeeCalculator({ lang = 'ja' }) {
  const c = getContent(lang);
  const t = c.calc;
  // Fixed initial values so server and browser render the same HTML; today's date is set after load.
  const [arrive, setArrive] = useState({ date: '2026-01-01', hour: '10', minute: '00' });
  // Default stay 10:00–11:00 = 300円 (owner, 2026-11-17).
  const [leave, setLeave] = useState({ date: '2026-01-01', hour: '11', minute: '00' });

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
        <TimeField id="in" label={t.arrive} value={arrive} onChange={setArrive} t={t} />
        <TimeField id="out" label={t.leave} value={leave} onChange={setLeave} t={t} />
      </div>

      <div className="chips">
        <span className="small muted">{t.from}</span>
        {PRESET_HOURS.map((h) => (
          <button key={h} type="button" className="chip" onClick={() => addFromArrival(h * 60)}>
            {t.preset(h)}
          </button>
        ))}
      </div>

      {r.error ? (
        <p className="alert" role="alert">
          {r.error === 'too_long' ? t.errors.too_long(MAX_DAYS) : t.errors[r.error]}
        </p>
      ) : (
        <div aria-live="polite" className="calc">
          <div className="total">
            <div>
              <div className="small">{t.estimate}</div>
              <div className="amount">
                {lang === 'en' ? `¥${yen(r.total)}` : yen(r.total)}
                {lang !== 'en' && <span className="small">{lang === 'zh' ? '日元' : '円'}</span>}
              </div>
              {r.free && <div className="small">{t.free(r.freeMinutes)}</div>}
            </div>
            <div className="small right">
              {t.duration} <strong>{formatDuration(r.minutes, lang)}</strong>
              <br />
              {formatDateTime(a, lang)} – {formatDateTime(b, lang)}
            </div>
          </div>

          <div className="grid">
            <div className="subtotal accent">
              <span>
                <strong>{t.day}</strong> <span className="small muted">{formatDuration(r.dayMinutes, lang)}</span>
              </span>
              <strong className="num">{c.yen(yen(r.day))}</strong>
            </div>
            <div className="subtotal">
              <span>
                <strong>{t.night}</strong> <span className="small muted">{formatDuration(r.nightMinutes, lang)}</span>
              </span>
              <strong className="num">{c.yen(yen(r.night))}</strong>
            </div>
          </div>

          <details className="breakdown">
            <summary>{t.breakdown(r.rows.length)}</summary>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">{t.th[0]}</th>
                    <th scope="col">{t.th[1]}</th>
                    <th scope="col" className="right">
                      {t.th[2]}
                    </th>
                    <th scope="col" className="right">
                      {t.th[3]}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {r.rows.map((row) => (
                    <tr key={`${row.key}-${row.start}`}>
                      <td>
                        <strong>{t.kinds[row.key]}</strong>
                      </td>
                      <td className="num">
                        {formatDateTime(row.start, lang)}–
                        {Math.floor((row.end - 1) / 1440) > Math.floor(row.start / 1440) ? t.nextDay(formatTime(row.end)) : formatTime(row.end)}
                      </td>
                      <td className="right">{formatDuration(row.minutes, lang)}</td>
                      <td className="right">
                        <strong className="num">{c.yen(yen(row.yen))}</strong>{' '}
                        <span className="small muted">{row.capped ? t.capped : t.units(row.units)}</span>
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
        {t.notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
        <li>
          {t.monthlyNote[0]}
          <a href="#monthly">{t.monthlyNote[1]}</a>
          {t.monthlyNote[2]}
        </li>
      </ul>
    </div>
  );
}
