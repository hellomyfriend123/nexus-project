import { Link } from 'react-router-dom';
import { categories } from '../../category/services/categoryService';
interface Props {
  categoryId: string;
  mode: string;
  setMode: (value: string) => void;
  budget: string;
  setBudget: (value: string) => void;
  onReset: () => void;
}
function ProductFilter({
  categoryId,
  mode,
  setMode,
  budget,
  setBudget,
  onReset,
}: Props) {
  return (
    <aside className="nx-filter-panel">
      <h2>Bộ lọc tìm kiếm</h2>
      <h3>Danh mục sản phẩm</h3>
      <nav className="nx-category-nav">
        <Link
          to="/categories/all"
          aria-current={categoryId === 'all' ? 'page' : undefined}
        >
          Tất cả danh mục
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            to={`/categories/${c.id}`}
            aria-current={c.id === categoryId ? 'page' : undefined}
          >
            {c.name}
          </Link>
        ))}
      </nav>
      <h3>Hình thức mua</h3>
      {[
        ['all', 'Tất cả'],
        ['auction', 'Đấu giá trực tiếp'],
        ['buy-now', 'Mua ngay'],
      ].map(([value, label]) => (
        <label className="nx-filter-option" key={value}>
          <input
            type="radio"
            name="mode"
            checked={mode === value}
            onChange={() => setMode(value)}
          />
          {label}
        </label>
      ))}
      <h3>Khoảng giá</h3>
      <select
        aria-label="Khoảng giá"
        value={budget}
        onChange={(e) => setBudget(e.target.value)}
      >
        <option value="all">Tất cả mức giá</option>
        <option value="under5">Dưới 5 triệu</option>
        <option value="5to20">5 triệu – 20 triệu</option>
        <option value="over20">Trên 20 triệu</option>
      </select>
      <button
        className="nx-button nx-button-soft nx-reset"
        onClick={() => {
          onReset();
        }}
      >
        Xóa bộ lọc
      </button>
    </aside>
  );
}

export default ProductFilter;
