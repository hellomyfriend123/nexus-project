import { Link } from 'react-router-dom';
import { categories } from '../../category/services/categoryService';
import CategoryCard from '../../category/components/CategoryCard';

function FeaturedCategories() {
  return (
    <>
      <div className="nx-section-heading nx-category-heading">
        <div>
          <h2>Khám phá theo danh mục nổi bật</h2>
          <p>Truy cập nhanh hàng nghìn sản phẩm phù hợp với nhu cầu của bạn</p>
        </div>
        <Link to="/categories/all" className="nx-blue">
          Xem tất cả danh mục →
        </Link>
      </div>
      {categories.length === 0 ? (
        <p className="nx-muted" role="status">
          Chưa có danh mục để hiển thị.
        </p>
      ) : (
        <nav className="nx-category-strip" aria-label="Danh mục sản phẩm">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
          <Link
            to="/categories/all"
            className="nx-category-link nx-category-link-all"
          >
            <span className="nx-category-icon" aria-hidden="true">
              ▦
            </span>
            <strong>Tất cả danh mục</strong>
            <span>Khám phá ngay →</span>
          </Link>
        </nav>
      )}
    </>
  );
}

export default FeaturedCategories;
