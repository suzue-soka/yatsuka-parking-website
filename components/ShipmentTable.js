'use client';

import { useState } from 'react';
import { carrierFor } from '@/lib/carriers';
import { onbText } from '@/lib/content/onboarding';
import { appText } from '@/lib/content/app';
import { DISCOUNT_TYPES } from '@/lib/program-data';

/** Shipping details of several machines as one table (partner dashboard): one row per machine,
 *  with a copy button for the tracking number and a link to each carrier's tracking page below. */
export default function ShipmentTable({ machines, usedIds = [], storeNotes = {}, lang = 'ja' }) {
  const O = onbText(lang);
  const M = O.billing.machine;
  const T = appText(lang);
  const [copied, setCopied] = useState(null);
  const type = (code) => DISCOUNT_TYPES.find((d) => d.code === code);
  // 店No.12：1時間無料（¥300・透析用） — 店No. assigned at payment, price per validation, note.
  const discountLines = (m) =>
    (m.discount_codes || []).map((c, i) => {
      const d = type(c);
      const no = (m.store_nos || [])[i];
      const extra = [d ? T.yen(d.yen.toLocaleString('ja-JP')) : null, no != null ? storeNotes[no] : null].filter(Boolean).join('・');
      return `${no != null ? `${O.terms.store(no)}：` : ''}${d ? T.discount(d.hours) : c}${extra ? `（${extra}）` : ''}`;
    });
  const carrierName = (m) => {
    const c = carrierFor(m.carrier);
    return c ? c[lang] || c.ja : m.carrier;
  };

  async function copy(m) {
    try {
      await navigator.clipboard.writeText(m.tracking_no);
      setCopied(m.id);
      setTimeout(() => setCopied(null), 2500);
    } catch {
      const el = document.getElementById(`trk-${m.id}`);
      if (el) window.getSelection()?.selectAllChildren(el);
    }
  }

  // One tracking link per carrier (its page is the same for every tracking number), only while
  // a shipped machine has not been used yet — first use shows it has arrived.
  const tracks = [
    ...new Map(
      machines.filter((m) => m.tracking_no && carrierFor(m.carrier) && !usedIds.includes(m.id)).map((m) => [carrierFor(m.carrier).url, m]),
    ).values(),
  ];

  return (
    <div className="shipment">
      <h3 className="shipment-title">{M.tableTitle}</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">{M.machineId}</th>
              <th scope="col">{M.storeDiscounts}</th>
              <th scope="col">{M.serial}</th>
              <th scope="col">{M.shipped}</th>
              <th scope="col">{M.carrier}</th>
              <th scope="col">{M.tracking}</th>
              <th scope="col">{M.warranty}</th>
              <th scope="col">{M.deliveryNoteShort}</th>
            </tr>
          </thead>
          <tbody>
            {machines.map((m) => (
              <tr key={m.id}>
                <td className="num">
                  <strong>{m.machine_code || '—'}</strong>
                </td>
                <td>
                  {discountLines(m).length
                    ? discountLines(m).map((l) => (
                        <div key={l} style={{ whiteSpace: 'nowrap' }}>
                          {l}
                        </div>
                      ))
                    : '—'}
                </td>
                <td className="num">{m.serial_no || '—'}</td>
                <td className="num">{m.shipped_on || '—'}</td>
                <td>{carrierName(m) || '—'}</td>
                <td>
                  {m.tracking_no ? (
                    <span className="shipment-tracking">
                      <span id={`trk-${m.id}`} className="num">
                        {m.tracking_no}
                      </span>
                      <button type="button" className="chip" onClick={() => copy(m)}>
                        {copied === m.id ? M.copied : M.copy}
                      </button>
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="num">{m.warranty_until || '—'}</td>
                <td>
                  {m.delivery_note_no ? (
                    <a href={`/portal/machines/${m.id}/delivery-note?download=1`} download className="num">
                      {m.delivery_note_no}
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tracks.length > 0 && (
        <p className="small" style={{ marginBottom: 0 }}>
          {tracks.map((m) => (
            <a key={m.id} className="btn btn-line" style={{ marginRight: 8 }} href={carrierFor(m.carrier).url} target="_blank" rel="noopener noreferrer">
              {M.trackOn(carrierName(m))}
            </a>
          ))}
          <br />
          <span className="muted">{M.trackHint}</span>
        </p>
      )}
    </div>
  );
}
