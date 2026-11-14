import Link from 'next/link';

const ORDER = ['approved', 'awaiting_payment', 'preparing', 'shipped', 'active'];

// Progress from approval to the start of service, with the partner's next step.
export default function OnboardingCard({ status, O }) {
  const i = ORDER.indexOf(status);
  if (i < 0 || status === 'active') return null;
  const t = O.onboarding;
  return (
    <div className="card" style={{ marginBottom: 16, borderColor: 'var(--orange)' }}>
      <h2 style={{ marginTop: 0, fontSize: 20 }}>{t.title}</h2>
      <ol className="progress">
        {t.steps.map((label, n) => (
          <li key={label} className={n < i ? 'done' : n === i ? 'current' : undefined} aria-current={n === i ? 'step' : undefined}>
            {label}
          </li>
        ))}
      </ol>
      <p>
        <strong>{O.status[status]}</strong>：{t.next[status]}
      </p>
      <Link className="btn btn-primary" href="/portal/billing">
        {t.go}
      </Link>
    </div>
  );
}
