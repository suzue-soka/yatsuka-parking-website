'use client';

import { useEffect, useRef } from 'react';

/** Wrap a server-rendered <table> to sort it by clicking a column header (click again to reverse).
 *  - Headers with no text are not sortable.
 *  - A cell's data-sort attribute, if present, is used instead of its text.
 *  - Rows containing a cell with colSpan (totals, "no data" lines) stay where they are, at the end.
 *  - `initial` = index of the column to sort by (ascending) when the page opens.
 *  - Numbers are compared as numbers (¥, 円, %, commas ignored); empty values ("—") always go last. */
export default function SortableTable({ children, initial }) {
  const ref = useRef(null);

  useEffect(() => {
    const table = ref.current?.querySelector('table');
    const head = table?.tHead?.rows[0];
    const body = table?.tBodies[0];
    if (!head || !body) return;
    const ths = [...head.cells];
    ths.forEach((th) => {
      if (th.textContent.trim()) {
        th.classList.add('sortable');
        th.tabIndex = 0;
      }
    });

    const val = (row, i) => {
      const td = row.cells[i];
      const raw = (td?.dataset.sort ?? td?.textContent ?? '').trim();
      if (!raw || raw === '—') return null;
      const n = raw.replace(/[¥￥,円%\s]/g, '');
      return /^-?\d+(\.\d+)?$/.test(n) ? Number(n) : raw;
    };

    const sortBy = (th) => {
      const i = ths.indexOf(th);
      const dir = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
      ths.forEach((h) => h.removeAttribute('aria-sort'));
      th.setAttribute('aria-sort', dir);
      const rows = [...body.rows];
      const fixed = rows.filter((r) => [...r.cells].some((c) => c.colSpan > 1));
      const data = rows.filter((r) => !fixed.includes(r));
      data.sort((a, b) => {
        const x = val(a, i), y = val(b, i);
        if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1;
        const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'ja', { numeric: true });
        return dir === 'ascending' ? c : -c;
      });
      [...data, ...fixed].forEach((r) => body.appendChild(r));
    };

    const onClick = (e) => {
      const th = e.target.closest('th.sortable');
      if (th && head.contains(th) && !e.target.closest('a, button')) sortBy(th);
    };
    const onKey = (e) => {
      const th = e.target.closest('th.sortable');
      if (th && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        sortBy(th);
      }
    };
    if (initial != null && ths[initial]?.classList.contains('sortable')) sortBy(ths[initial]);
    head.addEventListener('click', onClick);
    head.addEventListener('keydown', onKey);
    return () => {
      head.removeEventListener('click', onClick);
      head.removeEventListener('keydown', onKey);
    };
  }, [initial]);

  return (
    <div ref={ref} className="sortable-table">
      {children}
    </div>
  );
}
