import { useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCategories } from '../../category/hooks/useCategories';
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
  const availableCategories = useCategories();
  const [expanded, setExpanded] = useState(false);
  const controlsId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const collapseControls = () => {
    setExpanded(false);
    if (toggleRef.current?.offsetParent !== null) toggleRef.current?.focus();
  };
  return (
    <aside className="nx-filter-panel">
      <h2 className="nx-filter-heading">Khám phá sản phẩm</h2>
      <button ref={toggleRef} type="button" className="nx-filter-toggle" aria-expanded={expanded} aria-controls={controlsId} onClick={() => setExpanded(value => !value)}>
        <span><i className="bi bi-sliders" aria-hidden="true" /> Bộ lọc · {mode === 'auction' ? 'Đấu giá' : 'Mua trực tiếp'}</span>
        <i className={expanded ? 'bi bi-chevron-up' : 'bi bi-chevron-down'} aria-hidden="true" />
      </button>
      <div id={controlsId} className="nx-filter-controls" data-expanded={expanded}>
      {mode === 'buy-now' && <><h3>Danh mục sản phẩm</h3>
      <nav className="nx-category-nav">
        <Link
          to="/categories/all"
          aria-current={categoryId === 'all' ? 'page' : undefined}
          onClick={collapseControls}
        >
          Tất cả danh mục
        </Link>
        {availableCategories.map((c) => (
          <Link
            key={c.id}
            to={`/categories/${c.id}`}
            aria-current={c.id === categoryId ? 'page' : undefined}
            onClick={collapseControls}
          >
            {c.name}
          </Link>
        ))}
      </nav></>}
      <h3>Hình thức mua</h3>
      {[
        ['buy-now', 'Mua trực tiếp'],
        ['auction', 'Đấu giá'],
      ].map(([value, label]) => (
        <label className="nx-filter-option" key={value}>
          <input
            type="radio"
            name="mode"
            checked={mode === value}
            onChange={() => { setMode(value); collapseControls(); }}
          />
          {label}
        </label>
      ))}
      {mode === 'buy-now' && <><h3>Khoảng giá</h3>
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
      </button></>}
      </div>
    </aside>
  );
}

export default ProductFilter;
