import { Link } from 'react-router-dom';
import type { CatalogCategory as Category } from '../../../services/api/catalog';
function CategoryCard({ category }: { category: Category }) {
  return (
    <Link to={`/categories/${category.id}`} className="nx-category-link">
      <span className="nx-category-icon" aria-hidden="true">
        ▦
      </span>
      <strong>{category.name}</strong>
      <span>{category.description || 'Khám phá sản phẩm →'}</span>
    </Link>
  );
}

export default CategoryCard;
