import { homeContent } from '../constants/homeContent';
import { categoryIcon } from '../constants/homeAssets';
import { Link } from 'react-router-dom';
import { useCategories } from '../../category/hooks/useCategories';

export default function FeaturedCategories() {
  const categories = useCategories().filter(category => !category.parentId && category.status === 'ACTIVE').slice(0, 6);
  if (!categories.length) return null;
  return <section className="nx-home-categories" aria-labelledby="home-category-title">
    <div className="nx-section-heading"><div><h2 id="home-category-title">{homeContent.categories.title}</h2><p>{homeContent.categories.description}</p></div><Link to="/products?mode=buy-now" className="nx-section-link">{homeContent.categories.action} →</Link></div>
    <nav className="nx-category-strip" aria-label="Danh mục sản phẩm">{categories.map(category => <Link key={category.id} to={`/categories/${category.id}?mode=buy-now`} className="nx-home-category"><span className="nx-home-category__icon"><i className={`bi bi-${categoryIcon(category.name)}`} aria-hidden="true" /></span><span>{category.name}</span></Link>)}</nav>
  </section>;
}
