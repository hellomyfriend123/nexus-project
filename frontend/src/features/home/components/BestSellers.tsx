import { homeContent } from '../constants/homeContent';
import { Link } from 'react-router-dom';
import { useHomeProducts } from '../hooks/useHomeProducts';
import HomeProductPager from './HomeProductPager';

export default function BestSellers() {
  const { products, loading, error } = useHomeProducts(false);
  return <section className="nx-section" aria-labelledby="home-buy-now-title">
    <div className="nx-section-heading"><div><h2 id="home-buy-now-title">{homeContent.products.title}</h2><p>{homeContent.products.description}</p></div><Link to="/products?mode=buy-now" className="nx-section-link">{homeContent.products.action} →</Link></div>
    <HomeProductPager products={products} label="Sản phẩm mới đăng" loading={loading} error={error} />
  </section>;
}
