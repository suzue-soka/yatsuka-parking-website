import Link from 'next/link';

export default function PortalHeader({ title, links = [], email, logout = 'ログアウト' }) {
  return (
    <div className="band" style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <div>
          <p className="small" style={{ margin: 0 }}>
            {email}
          </p>
          <h1 style={{ margin: '2px 0 0', fontSize: 24 }}>{title}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {links.map((l) => (
            <Link key={l.href} className="btn btn-ghost" href={l.href}>
              {l.label}
            </Link>
          ))}
          <form action="/auth/signout" method="post">
            <button className="btn btn-ghost" type="submit">
              {logout}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
