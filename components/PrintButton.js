'use client';

export default function PrintButton({ label }) {
  return (
    <button type="button" className="btn btn-line" onClick={() => window.print()}>
      {label}
    </button>
  );
}
