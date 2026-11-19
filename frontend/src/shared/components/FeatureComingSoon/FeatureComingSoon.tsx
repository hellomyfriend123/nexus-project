import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import comingSoonAnimation from '../../../assets/animations/czhdfjfjd-2122698776250851778-1.gif';
import './FeatureComingSoon.css';

export interface FeatureComingSoonProps {
  title?: string;
  description?: string;
  /** Use an explicit destination so a direct visit also has a useful return link. */
  action?: { to: string; label: string };
}

/** Content for a planned feature; mount inside the buyer/seller account layout. */
export default function FeatureComingSoon({
  title = 'Tính năng đang được chuẩn bị',
  description = 'Chúng tôi đang hoàn thiện tính năng này. Bạn quay lại sau nhé!',
  action,
}: FeatureComingSoonProps) {
  const headingId = useId();
  const [showAnimation, setShowAnimation] = useState(true);

  return (
    <section className="nx-coming-soon" aria-labelledby={headingId}>
      <div className="nx-coming-soon__art" aria-hidden="true" data-animated={showAnimation}>
        {showAnimation && <img className="nx-coming-soon__gif" src={comingSoonAnimation} alt="" width={320} height={320} decoding="async" />}
        <span className="nx-coming-soon__still"><i className="bi bi-tools" /></span>
      </div>
      <button className="nx-coming-soon__motion" type="button" onClick={() => setShowAnimation(value => !value)}>
        {showAnimation ? 'Ẩn ảnh động' : 'Hiện ảnh động'}
      </button>
      <span className="nx-coming-soon__badge">Đang phát triển</span>
      <h1 id={headingId} className="nx-coming-soon__title">{title}</h1>
      <p className="nx-coming-soon__description">{description}</p>
      {action && <Link className="nx-coming-soon__action" to={action.to}>{action.label}</Link>}
    </section>
  );
}
