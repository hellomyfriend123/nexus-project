import type { ReactNode } from 'react';

export default function AuctionSection({ number, title, caption, children, aside }: { number: number; title: string; caption: string; children: ReactNode; aside?: ReactNode }) {
  const icons = ['bi-box-seam', 'bi-cash-stack', 'bi-clock', 'bi-shield-check'];
  return <section className={`sca-section sca-section-${number}`}><header className="sca-section-heading"><div className="sca-section-title"><i className={`bi ${icons[number - 1]}`} aria-hidden="true" /><h2>{number}. {title}</h2></div><p>{caption}</p>{aside && <div className="sca-heading-aside">{aside}</div>}</header><div className="sca-section-body">{children}</div></section>;
}
