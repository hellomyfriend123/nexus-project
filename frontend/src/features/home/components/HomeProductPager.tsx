import { useId, useState } from 'react';
import type { Listing as Product } from '../../../services/api/catalog';
import ProductCard from '../../product/components/ProductCard';
import '../styles/home-product-pager.css';

const PRODUCTS_PER_PAGE = 4;

function HomeProductPager({
  products,
  label,
}: {
  products: Product[];
  label: string;
}) {
  const [page, setPage] = useState(1);
  const gridId = useId();
  const pageCount = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const end = Math.min(start + PRODUCTS_PER_PAGE, products.length);

  if (products.length === 0) {
    return (
      <div className="nx-empty" role="status">
        <h3>Chưa có sản phẩm</h3>
        <p>Sản phẩm sẽ hiển thị khi có dữ liệu.</p>
      </div>
    );
  }

  return (
    <div
      className="nx-home-product-pager"
      role="region"
      aria-label={label}
      aria-roledescription="carousel"
    >
      <div className="nx-home-pager-toolbar">
        <span role="status" aria-live="polite" aria-atomic="true">
          {label}:{' '}
          {products.length
            ? `${start + 1}–${end} / ${products.length}`
            : 'Chưa có sản phẩm'}
        </span>
        <span>
          Trang {currentPage} / {pageCount}
        </span>
      </div>

      <div className="nx-home-pager-carousel">
        <div id={gridId} className="nx-home-pager-viewport">
          <div
            className="nx-home-pager-track"
            style={{ transform: `translateX(-${(currentPage - 1) * 100}%)` }}
          >
            {Array.from({ length: pageCount }, (_, index) => (
              <div
                key={index}
                className="nx-home-pager-page"
                role="group"
                aria-roledescription="slide"
                aria-label={`Trang ${index + 1} / ${pageCount}`}
                aria-hidden={currentPage !== index + 1}
                inert={currentPage !== index + 1}
              >
                <div className="nx-grid">
                  {products
                    .slice(
                      index * PRODUCTS_PER_PAGE,
                      (index + 1) * PRODUCTS_PER_PAGE,
                    )
                    .map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          className="nx-home-pager-arrow nx-home-pager-previous"
          type="button"
          aria-label={`Trang trước: ${label}`}
          aria-controls={gridId}
          disabled={currentPage === 1}
          onClick={() => setPage(currentPage - 1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m14 6-6 6 6 6" />
          </svg>
        </button>
        <button
          className="nx-home-pager-arrow nx-home-pager-next"
          type="button"
          aria-label={`Trang sau: ${label}`}
          aria-controls={gridId}
          disabled={currentPage === pageCount}
          onClick={() => setPage(currentPage + 1)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m10 6 6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default HomeProductPager;
