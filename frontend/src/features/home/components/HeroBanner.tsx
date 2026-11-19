import { Link } from 'react-router-dom';
import { homeContent } from '../constants/homeContent';
import { homeAssets } from '../constants/homeAssets';

export default function HeroBanner() {
  const hero = homeContent.hero;
  return <section className="nx-hero" aria-labelledby="home-hero-title">
    <div className="nx-hero-copy"><span className="nx-eyebrow">{hero.eyebrow}</span>
      <h1 id="home-hero-title">{hero.title}</h1><p>{hero.description}</p>
      <div className="nx-hero-actions"><Link className="nx-button nx-button-primary" to={hero.primaryAction.to}>{hero.primaryAction.label} <span aria-hidden="true">→</span></Link><Link className="nx-hero-secondary" to={hero.secondaryAction.to}>{hero.secondaryAction.label} <span aria-hidden="true">↗</span></Link></div>
    </div>
    <img className="nx-hero-art" src={homeAssets.hero} alt="" width={560} height={360} fetchPriority="high" />
  </section>;
}
