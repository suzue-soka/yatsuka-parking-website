'use client';

import { useState } from 'react';

// Two tiers on PC (owner, 2026-11-27): the eight facts that decide a visit stay visible,
// the rest open with one button. Phones and tablets show every card, as before.
const PRIMARY = new Set(['h24', 'capacity', 'size', 'max', 'card', 'wheelchair', 'toiletAccessible', 'ev']);

export default function FacilityGrid({ items, labels }) {
  const [all, setAll] = useState(false);
  return (
    <>
      <div id="facility-grid" className={`grid compact facility-grid${all ? ' show-all' : ''}`}>
        {items.map((a) => (
          <div key={a.t} className={`card facility-item${PRIMARY.has(a.icon) ? '' : ' facility-extra'}`}>
            <span className="facility-icon" dangerouslySetInnerHTML={{ __html: a.svg }} />
            <div>
              <strong>{a.href ? <a href={a.href}>{a.t}</a> : a.t}</strong>
              <div className="small muted">{a.d}</div>
              {a.note && <div className="small facility-note">{a.note}</div>}
            </div>
          </div>
        ))}
      </div>
      <p className="facility-toggle">
        <button type="button" className="btn btn-line" aria-expanded={all} aria-controls="facility-grid" onClick={() => setAll((v) => !v)}>
          {all ? labels.showLess : labels.showAll}
        </button>
      </p>
    </>
  );
}
