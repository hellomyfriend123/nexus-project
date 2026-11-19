import { homeContent } from '../constants/homeContent';
import { Link } from 'react-router-dom';
import { useHomeProducts } from '../hooks/useHomeProducts';
import HomeProductPager from './HomeProductPager';

export default function NewArrivals() {
  const { products, loading, error, requiresLogin } = useHomeProducts(true);
  return <section className="nx-section" aria-labelledby="home-auctions-title">
    <div className="nx-section-heading"><div><h2 id="home-auctions-title">{homeContent.auctions.title}</h2><p>{homeContent.auctions.description}</p></div><Link to="/products?mode=auction" className="nx-section-link">{homeContent.auctions.action} →</Link></div>
    {requiresLogin ? <div className="nx-home-signin"><p>Đăng nhập để xem và tham gia các phiên đấu giá.</p><Link className="nx-button nx-button-light" to="/login">Đăng nhập</Link></div> : <HomeProductPager products={products} label="Phiên đấu giá" loading={loading} error={error} />}
  </section>;
}
