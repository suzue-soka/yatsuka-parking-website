'use client';

import { useFormStatus } from 'react-dom';

// Submit button that asks for confirmation first.
export default function ConfirmButton({ message, children, ...props }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      {...props}
    >
      {children}
    </button>
  );
}
