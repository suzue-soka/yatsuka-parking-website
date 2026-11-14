import Image from 'next/image';
import { SITE } from '@/lib/site';
import { getContent } from '@/lib/content';

export default function ValidatorCard({ lang = 'ja' }) {
  const c = getContent(lang);
  const v = c.validator;
  return (
    <div className="card validator">
      <Image src={SITE.validatorImage} alt={v.alt} width={440} height={440} sizes="(min-width: 700px) 200px, 60vw" />
      <div>
        <p className="small muted" style={{ margin: 0 }}>
          {v.kicker}
        </p>
        <h3 style={{ margin: '2px 0 8px', fontSize: 19 }}>{v.name}</h3>
        <p style={{ margin: '0 0 8px' }}>
          <strong className="num" style={{ fontSize: 24 }}>
            {c.yen(SITE.validatorPrice)}
          </strong>{' '}
          <span className="small muted">{v.priceNote}</span>
        </p>
        <ul className="small" style={{ margin: 0, paddingLeft: 20 }}>
          {v.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
