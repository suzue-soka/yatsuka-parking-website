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
  // 店No.12：300円（1時間無料・透析用） — 店No. assigned at payment, price per validation, note.
  const discountLines = (m) =>
    (m.discount_codes || []).map((c, i) => {
      const d = type(c);
      const no = (m.store_nos || [])[i];
      const note = no != null ? storeNotes[no] : null;
      const text = d ? priceLabel(T.yen(d.yen.toLocaleString('ja-JP')), T.discount(d.hours), note) : [c, note].filter(Boolean).join('・');
      return `${no != null ? `${O.terms.store(no)}：` : ''}${text}`;
    });

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
