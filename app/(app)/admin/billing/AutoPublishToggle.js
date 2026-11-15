'use client';

// "Publish automatically" check box; saved as soon as it is changed (the value is remembered).
export default function AutoPublishToggle({ action, on, label }) {
  return (
    <form action={action}>
      <label className="check">
        <input type="checkbox" name="auto" defaultChecked={on} onChange={(e) => e.currentTarget.form.requestSubmit()} />
        <strong>{label}</strong>
      </label>
    </form>
  );
}
