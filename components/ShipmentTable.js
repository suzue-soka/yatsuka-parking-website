import { onbText } from '@/lib/content/onboarding';
import { appText } from '@/lib/content/app';
import { DISCOUNT_TYPES } from '@/lib/program-data';
import { priceLabel } from '@/lib/price-label';

/** 認証機情報 (partner 認証機 page): one row per paid machine. Shipping details (date, carrier,
 *  tracking number) are not shown here — the partner gets them by email when the machine is shipped. */
export default function ShipmentTable({ machines, storeNotes = {}, lang = 'ja' }) {
  const O = onbText(lang);
  const M = O.billing.machine;
  const T = appText(lang);
  const type = (code) => DISCOUNT_TYPES.find((d) => d.code === code);
  // One entry per button: Btn.No. (the 店No. assigned at payment) and 300円（1時間無料・透析用）.
  const buttons = (m) =>
    (m.discount_codes || []).map((c, i) => {
      const d = type(c);
      const no = (m.store_nos || [])[i];
      // Notes such as 透析用 are shown; the machine ID (stored as the note of its 店No.) is not — it has its own column.
      const note = no != null && storeNotes[no] !== m.machine_code ? storeNotes[no] : null;
      const text = d ? priceLabel(T.yen(d.yen.toLocaleString('ja-JP')), T.discount(d.hours), note) : [c, note].filter(Boolean).join('・');
      return { no: no ?? '—', text };
    });
  const stack = (list, key) =>
    list.length
      ? list.map((b, i) => (
          <div key={i} style={{ whiteSpace: 'nowrap' }}>
            {b[key]}
          </div>
        ))
      : '—';

  return (
    <div className="shipment">
      <h3 className="shipment-title">{M.tableTitle}</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">{M.machineId}</th>
              <th scope="col" className="right">
                {M.btnNo}
              </th>
              <th scope="col" className="right" style={{ paddingRight: 32 }}>
                {M.discounts}
              </th>
              <th scope="col">{M.serial}</th>
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
                <td className="num right">{stack(buttons(m), 'no')}</td>
                <td className="right" style={{ paddingRight: 32 }}>
                  {stack(buttons(m), 'text')}
                </td>
                <td className="num">{m.serial_no || '—'}</td>
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
    </div>
  );
}
