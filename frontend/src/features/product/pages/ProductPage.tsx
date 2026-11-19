import { useProductListing, PAGE_SIZE } from '../hooks/useProductListing';
import ProductList from '../components/ProductList';
import ProductFilter from '../components/ProductFilter';
import ProductSort from '../components/ProductSort';
import ProductPagination from '../components/ProductPagination';
import '../styles/product-list.css';

function ProductPage() {
  const { categoryId, mode, query, setQuery, sort, budget, setBudget, setMode, resetFilters, resultKey, page, products, total, pageCount, loading, error, setRetry, start, pageProducts, selectSort, activeFilters, setPagination } = useProductListing();

  return (
    <main className="nx-container nx-category-page nx-product-results">
      <div className="nx-results-toolbar">
        <p role="status">
          {total ? (
            <>
              <strong>
                {start + 1}–{Math.min(start + PAGE_SIZE, total)}
              </strong>{' '}
              trong <strong>{total}</strong> kết quả
            </>
          ) : (
            '0 kết quả'
          )}
          {mode === 'buy-now' && query.trim() && (
            <>
              {' '}
              cho “<strong>{query.trim()}</strong>”
            </>
          )}
        </p>
        {mode === 'buy-now' ? <ProductSort sort={sort} setSort={selectSort} /> : <span>Sắp kết thúc trước</span>}
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
          {mode === 'buy-now' && <label className="nx-results-search">
            <span>Tìm trong danh sách</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nhập tên sản phẩm…"
            />
          </label>}
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
            <h1 id="product-results-title">{mode === 'auction' ? 'Phiên đấu giá' : 'Sản phẩm'}</h1>
            <p>
              {mode === 'auction' ? 'Theo dõi mức giá và tham gia các phiên đang diễn ra.' : 'Tìm sản phẩm phù hợp và thêm vào giỏ hàng.'}
            </p>
          </div>
          {loading ? <p role="status">Đang tải sản phẩm…</p> : error ? <div className="nx-empty" role="alert"><p>{error}</p><button className="nx-button nx-button-soft" onClick={() => setRetry(value => value + 1)}>Thử lại</button></div> : total ? (
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
