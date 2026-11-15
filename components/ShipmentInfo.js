'use client';

import { useState } from 'react';
import { carrierFor } from '@/lib/carriers';
import { onbText } from '@/lib/content/onboarding';
import { appText } from '@/lib/content/app';
import { DISCOUNT_TYPES } from '@/lib/program-data';

/** Shipping details of one validation machine, for the partner: date, carrier, tracking
 *  number (with a copy button) and a link to the carrier's tracking page. */
export default function ShipmentInfo({ machine: m, lang = 'ja', showTitle = true }) {
  const M = onbText(lang).billing.machine;
  const T = appText(lang);
  const hours = (code) => DISCOUNT_TYPES.find((d) => d.code === code)?.hours;
  const title = showTitle ? (m.shipped_on ? M.shippedTitle : M.preparingTitle) : null;
  const [copied, setCopied] = useState(false);
  const carrier = carrierFor(m.carrier);
  const carrierName = carrier ? carrier[lang] || carrier.ja : m.carrier;

  async function copy() {
    try {
      await navigator.clipboard.writeText(m.tracking_no);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked: select the number so it can be copied by hand.
      const el = document.getElementById(`trk-${m.id}`);
      if (el) window.getSelection()?.selectAllChildren(el);
    }
  }

  return (
    <div className="shipment">
      {title && <h3 className="shipment-title">{title}</h3>}
      <table className="kv">
        <tbody>
          {m.machine_code && (
            <tr>
              <th scope="row">{M.machineId}</th>
              <td className="num">
                <strong>{m.machine_code}</strong>
              </td>
            </tr>
          )}
          <tr>
            <th scope="row">{M.model}</th>
            <td>{m.model}</td>
          </tr>
          {(m.discount_codes || []).length > 0 && (
            <tr>
              <th scope="row">{M.discounts}</th>
              <td>{m.discount_codes.map((c) => (hours(c) ? T.discount(hours(c)) : c)).join('、')}</td>
            </tr>
          )}
          <tr>
            <th scope="row">{M.serial}</th>
            <td>{m.serial_no || '—'}</td>
          </tr>
          <tr>
            <th scope="row">{M.shipped}</th>
            <td>{m.shipped_on || '—'}</td>
          </tr>
          <tr>
            <th scope="row">{M.carrier}</th>
            <td>{carrierName || '—'}</td>
          </tr>
          <tr>
            <th scope="row">{M.tracking}</th>
            <td>
              {m.tracking_no ? (
                <span className="shipment-tracking">
                  <strong id={`trk-${m.id}`} className="num">
                    {m.tracking_no}
                  </strong>
                  <button type="button" className="chip" onClick={copy}>
                    {copied ? M.copied : M.copy}
                  </button>
                </span>
              ) : (
                '—'
              )}
            </td>
          </tr>
          {m.warranty_until && (
            <tr>
              <th scope="row">{M.warranty}</th>
              <td>{m.warranty_until}</td>
            </tr>
          )}
        </tbody>
      </table>
      {m.delivery_note_no && (
        <p className="small" style={{ margin: '8px 0 0' }}>
          <a href={`/portal/machines/${m.id}/delivery-note?download=1`} download>
            {M.deliveryNote}
          </a>
          {' '}
          <span className="muted num">{m.delivery_note_no}</span>
        </p>
      )}
      {m.tracking_no && carrier && (
        <p className="small" style={{ marginBottom: 0 }}>
          <a className="btn btn-line" href={carrier.url} target="_blank" rel="noopener noreferrer">
            {M.trackOn(carrierName)}
          </a>
          <br />
          <span className="muted">{M.trackHint}</span>
        </p>
      )}
    </div>
  );
}
