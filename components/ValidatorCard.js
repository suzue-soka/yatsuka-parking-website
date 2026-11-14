import Image from 'next/image';
import { VALIDATOR } from '@/lib/site';

export default function ValidatorCard() {
  return (
    <div className="card validator">
      <Image src={VALIDATOR.image} alt={`${VALIDATOR.name}。白い本体の上面に「1」「2」の青いボタンがあります`} width={440} height={440} sizes="(min-width: 700px) 200px, 60vw" />
      <div>
        <p className="small muted" style={{ margin: 0 }}>
          提携店舗に設置する認証機
        </p>
        <h3 style={{ margin: '2px 0 8px', fontSize: 19 }}>{VALIDATOR.name}</h3>
        <p style={{ margin: '0 0 8px' }}>
          <strong className="num" style={{ fontSize: 24 }}>
            {VALIDATOR.price}円
          </strong>{' '}
          <span className="small muted">（税込・送料無料）</span>
        </p>
        <ul className="small" style={{ margin: 0, paddingLeft: 20 }}>
          {VALIDATOR.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
