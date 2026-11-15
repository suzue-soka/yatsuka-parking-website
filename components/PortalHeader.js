import Link from 'next/link';
import IdleWatch from '@/components/IdleWatch';

// Log-out is in the site toolbar (top right), next to 提携店舗ページへ / 管理画面へ.
export default function PortalHeader({ title, links = [], email }) {
  return (
    <div className="band" style={{ marginBottom: 20 }}>
      <IdleWatch />
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
        </div>
      </div>
    </div>
  );
}
