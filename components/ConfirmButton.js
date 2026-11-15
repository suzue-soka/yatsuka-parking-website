'use client';

import SubmitButton from '@/components/SubmitButton';

// Submit button that asks for confirmation first, then shows 処理中… until done.
export default function ConfirmButton({ message, children, ...props }) {
  return (
    <SubmitButton confirm={message} {...props}>
      {children}
    </SubmitButton>
  );
}
