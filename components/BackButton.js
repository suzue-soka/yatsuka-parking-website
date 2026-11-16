'use client';

import { useRouter } from 'next/navigation';

/** Returns to the previous page; if the page was opened directly (no history), goes to `fallback`. */
export default function BackButton({ label, fallback }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn btn-line"
      onClick={() => (window.history.length > 1 && document.referrer.startsWith(window.location.origin) ? router.back() : router.push(fallback))}
    >
      ← {label}
    </button>
  );
}
