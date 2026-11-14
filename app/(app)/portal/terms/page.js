import PortalHeader from '@/components/PortalHeader';
import { getAppLang } from '@/lib/app-lang';
import { onbText } from '@/lib/content/onboarding';
import { programText } from '@/lib/content/program';
import { requirePartner, portalLinks } from '@/lib/portal-guard';
import { DISCOUNT_TYPES, VOLUME_TIERS } from '@/lib/program-data';
import { href } from '@/lib/i18n';
import { yen } from '@/lib/dates';

export const dynamic = 'force-dynamic';
export async function generateMetadata() {
  return { title: onbText(await getAppLang()).terms.title, robots: { index: false, follow: false } };
}

export default async function Terms() {
  const { supabase, claims, partner: p, lang, T, O } = await requirePartner('/portal/terms');
  if (!p) return <p className="wrap section">{T.portal.noPartner}</p>;
  const R = O.terms;
  const P = programText(lang);
  const { data: stores } = await supabase.from('store_numbers').select('store_no, discount_code, valid_from, valid_to').order('store_no');
  const dt = (code) => DISCOUNT_TYPES.find((d) => d.code === code);
  const current = (stores || []).filter((s) => !s.valid_to);

  return (
    <section className="wrap section">
      <PortalHeader title={R.title} email={claims.email} logout={T.logout} links={portalLinks(O)} />
      <div className="grid" style={{ alignItems: 'start' }}>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: 20 }}>{current.length ? R.yourDiscounts : R.requested}</h2>
          <ul>
            {current.length
              ? current.map((s) => (
                  <li key={s.store_no}>
                    {R.store(s.store_no)}：{P.discountLabel(dt(s.discount_code)?.hours)}（{T.yen(yen(dt(s.discount_code)?.yen))}）
                  </li>
                ))
              : (p.requested_discounts || []).map((c) => (
                  <li key={c}>
                    {P.discountLabel(dt(c)?.hours)}（{T.yen(yen(dt(c)?.yen))}）
                  </li>
                ))}
          </ul>
          <h2 style={{ fontSize: 20 }}>{P.volumeTitle}</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {P.thVolume.map((h) => (
                    <th key={h} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {VOLUME_TIERS.map((v) => (
                  <tr key={v.min}>
                    <td className="num">{P.range(v.min, v.max)}</td>
                    <td className="num">{v.rate}%</td>
                    <td className="num">{P.pays(100 - v.rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small">{P.volumeNote}</p>
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: 20 }}>{R.paymentTitle}</h2>
          <ul>
            {R.payment.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <h2 style={{ fontSize: 20 }}>{P.conditionsTitle}</h2>
          <ul>
            {P.conditions.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p>
            <a href={href(lang, '/partners/terms')}>{R.termsLink}</a>
          </p>
        </div>
      </div>
    </section>
  );
}
