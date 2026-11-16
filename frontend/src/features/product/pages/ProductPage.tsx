import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { categories } from '../../category/services/categoryService';
import { products } from '../services/productService';
import ProductList from '../components/ProductList';
import ProductFilter from '../components/ProductFilter';
import ProductSort from '../components/ProductSort';
import ProductPagination from '../components/ProductPagination';
import '../styles/product-list.css';

const PAGE_SIZE = 24;
const budgetLabels: Record<string, string> = {
  under5: 'Dưới 5 triệu',
  '5to20': '5 triệu – 20 triệu',
  over20: 'Trên 20 triệu',
};

function ProductPage() {
  const { categoryId = 'all' } = useParams();
  const [params, setParams] = useSearchParams();
  const requestedMode = params.get('mode');
  const mode =
    requestedMode === 'auction' || requestedMode === 'buy-now'
      ? requestedMode
      : 'all';
  const query = params.get('q') ?? '';
  function setQuery(value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set('q', value);
    else next.delete('q');
    setParams(next);
  }
  const [sort, setSort] = useState('featured');
  const [budget, setBudget] = useState('all');
  const [pagination, setPagination] = useState({ key: '', page: 1 });
  const category = categories.find((item) => item.id === categoryId);

  function setMode(value: string) {
    const next = new URLSearchParams(params);
    if (value === 'all') next.delete('mode');
    else next.set('mode', value);
    setParams(next);
  }

  function resetFilters() {
    const next = new URLSearchParams(params);
    next.delete('q');
    next.delete('mode');
    setParams(next);
    setSort('featured');
    setBudget('all');
  }

  const visible = products
    .filter((product) => {
      const matchesCategory =
        categoryId === 'all' || product.categoryId === categoryId;
      const matchesMode = mode === 'all' || product.mode === mode;
      const matchesQuery = product.name
        .toLocaleLowerCase('vi')
        .includes(query.trim().toLocaleLowerCase('vi'));
      const matchesBudget =
        budget === 'all' ||
        (budget === 'under5'
          ? product.price < 5000000
          : budget === '5to20'
            ? product.price >= 5000000 && product.price <= 20000000
            : product.price > 20000000);
      return matchesCategory && matchesMode && matchesQuery && matchesBudget;
    })
    .sort((a, b) =>
      sort === 'price-low'
        ? a.price - b.price
        : sort === 'price-high'
          ? b.price - a.price
          : sort === 'rating'
            ? b.rating - a.rating
            : 0,
    );

  // Reset pagination whenever the result criteria change, including category navigation.
  const resultKey = JSON.stringify([categoryId, mode, query, budget, sort]);
  const pageCount = Math.ceil(visible.length / PAGE_SIZE);
  const page =
    pagination.key === resultKey
      ? Math.min(pagination.page, Math.max(pageCount, 1))
      : 1;
  const start = (page - 1) * PAGE_SIZE;
  const pageProducts = visible.slice(start, start + PAGE_SIZE);
  const activeFilters = [
    ...(query ? [{ label: `Tìm: ${query}`, clear: () => setQuery('') }] : []),
    ...(mode !== 'all'
      ? [
          {
            label: mode === 'auction' ? 'Đấu giá trực tiếp' : 'Mua ngay',
            clear: () => setMode('all'),
          },
        ]
      : []),
    ...(budget !== 'all'
      ? [{ label: budgetLabels[budget], clear: () => setBudget('all') }]
      : []),
  ];

  if (categoryId !== 'all' && !category) {
    return (
      <main className="nx-container nx-empty">
        <h1>Không tìm thấy danh mục</h1>
        <Link to="/categories/all">Xem tất cả danh mục →</Link>
      </main>
    );
  }

  return (
    <main className="nx-container nx-category-page nx-product-results">
      <div className="nx-results-toolbar">
        <p role="status">
          {visible.length ? (
            <>
              <strong>
                {start + 1}–{Math.min(start + PAGE_SIZE, visible.length)}
              </strong>{' '}
              trong <strong>{visible.length}</strong> kết quả
            </>
          ) : (
            '0 kết quả'
          )}
          {query.trim() && (
            <>
              {' '}
              cho “<strong>{query.trim()}</strong>”
            </>
          )}
        </p>
        <ProductSort sort={sort} setSort={setSort} />
      </div>
      <div className="nx-category-layout">
        <ProductFilter
          categoryId={categoryId}
          mode={mode}
          setMode={setMode}
          budget={budget}
          setBudget={setBudget}
          onReset={resetFilters}
        />
        <section aria-labelledby="product-results-title">
          <label className="nx-results-search">
            <span>Tìm trong danh sách</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nhập tên sản phẩm…"
            />
          </label>
          {activeFilters.length > 0 && (
            <div className="nx-active-filters" aria-label="Bộ lọc đang áp dụng">
              {activeFilters.map((filter) => (
                <button
                  key={filter.label}
                  type="button"
                  onClick={filter.clear}
                  aria-label={`Bỏ bộ lọc ${filter.label}`}
                >
                  {filter.label} <span aria-hidden="true">×</span>
                </button>
              ))}
              <button
                type="button"
                className="nx-clear-filters"
                onClick={resetFilters}
              >
                Xóa tất cả
              </button>
            </div>
          )}
          <div className="nx-results-intro">
            <h2 id="product-results-title">Kết quả</h2>
            <p>
              Giá đấu hiện tại có thể khác giá mua ngay. Xem chi tiết sản phẩm
              trước khi giao dịch.
            </p>
          </div>
          {visible.length ? (
            <>
              <ProductList products={pageProducts} />
              <ProductPagination
                page={page}
                pageCount={pageCount}
                onPageChange={(nextPage) =>
                  setPagination({ key: resultKey, page: nextPage })
                }
              />
            </>
          ) : (
            <div className="nx-empty">
              <h2>
                {products.length
                  ? 'Không tìm thấy sản phẩm phù hợp'
                  : 'Chưa có sản phẩm'}
              </h2>
              <p>
                {products.length
                  ? 'Thử từ khóa khác hoặc bỏ bớt bộ lọc để xem thêm sản phẩm.'
                  : 'Danh sách sẽ hiển thị khi có nguồn dữ liệu sản phẩm.'}
              </p>
              <button
                type="button"
                className="nx-button nx-button-primary"
                onClick={resetFilters}
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default ProductPage;
