import { Link } from 'react-router-dom';
import type { Category } from '../types/category';
function CategoryCard({ category }: { category: Category }) {
  return (
    <Link to={`/categories/${category.id}`} className="nx-category-link">
      <span className="nx-category-icon" aria-hidden="true">
        {category.icon}
      </span>
      <strong>{category.name}</strong>
      <span>{category.count} sản phẩm</span>
    </Link>
  );
}

export default CategoryCard;
