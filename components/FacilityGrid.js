'use client';

import { useState } from 'react';

// Two tiers on every screen size (owner, 2026-11-27): the seven facts that decide a visit stay
// visible, the rest open with one button.
const PRIMARY = new Set(['h24', 'capacity', 'size', 'max', 'wheelchair', 'toiletAccessible', 'ev']);
// The payment-method cards are shown in the RATES section instead (owner, 2026-11-27).
const PAY = new Set(['card', 'emoney', 'cash']);

export default function FacilityGrid({ items, labels }) {
  const [all, setAll] = useState(false);
  return (
    <>
      <div id="facility-grid" className={`grid compact facility-grid${all ? ' show-all' : ''}`}>
        {items.map((a) => (
          <div key={a.t} className={`card facility-item${PRIMARY.has(a.icon) ? '' : ' facility-extra'}${PAY.has(a.icon) ? ' facility-pay' : ''}`}>
            <span className="facility-icon" dangerouslySetInnerHTML={{ __html: a.svg }} />
            <div>
              <strong>
                {a.href === '#vehicles' ? (
                  <>
                    {/* The vehicles section has a PC and a phone version, each with its own anchor. */}
                    <a className="pc-only-inline" href="#vehicles">{a.t}</a>
                    <a className="sp-only-inline" href="#vehicles-m">{a.t}</a>
                  </>
                ) : a.href ? (
                  <a href={a.href}>{a.t}</a>
                ) : (
                  a.t
                )}
              </strong>
              <div className="small muted">{a.d}</div>
              {a.note && <div className="small facility-note">{a.note}</div>}
            </div>
          </div>
        ))}
        {/* The button is a cell of the grid: last place of the second row on PC (7 cards + button),
            and after the last card once everything is shown (owner, 2026-11-27). */}
        <div className="facility-toggle">
          <button type="button" className="btn btn-line" aria-expanded={all} aria-controls="facility-grid" onClick={() => setAll((v) => !v)}>
            {all ? labels.showLess : labels.showAll}
          </button>
        </div>
      </div>
    </>
  );
}
