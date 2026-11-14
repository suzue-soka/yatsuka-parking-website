import { requireAdmin } from '@/lib/admin-guard';
import PortalHeader from '@/components/PortalHeader';
import ImportForm from './ImportForm';

export const metadata = { title: 'ParkingWeb 取込', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function ImportPage() {
  const { claims } = await requireAdmin();
  return (
    <section className="wrap section">
      <PortalHeader title="ParkingWeb 取込" email={claims.email} links={[{ href: '/admin', label: '管理画面へ' }]} />
      <ImportForm />
      <div className="card" style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>取込のルール</h2>
        <ul className="small">
          <li>同じファイルを何度取り込んでも、二重に登録されることはありません（増えた分だけ追加）。</li>
          <li>内容がまったく同じ行も、別々の利用として登録します。二重出力と確認できた場合のみ、管理者が除外できます。</li>
          <li>小計・合計が合わないファイルは取り込まず、記録だけ残します。</li>
          <li>元のCSVファイルは、変更されない形で保管します。</li>
        </ul>
      </div>
    </section>
  );
}
