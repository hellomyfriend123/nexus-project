import { Link } from 'react-router-dom';
import { useHomeProducts } from '../hooks/useHomeProducts';
import HomeProductPager from './HomeProductPager';

function NewArrivals() {
  const { products: auctionProducts, loading, error } = useHomeProducts(true);

  return (
    <section className="nx-section" aria-labelledby="home-auctions-title">
      <div className="nx-section-heading">
        <div>
          <h2 id="home-auctions-title">
            <span className="nx-heading-icon" aria-hidden="true">
              ϟ
            </span>{' '}
            Đấu Giá Trực Tiếp - Sắp Kết Thúc{' '}
            <span className="nx-live-label">
              <span className="nx-live-dot" /> LIVE
            </span>
          </h2>
          <p>Đặt giá ngay, sở hữu công nghệ đỉnh cao với mức giá tốt nhất.</p>
        </div>
        <Link to="/categories/all?mode=auction" className="nx-section-link">
          Xem tất cả phiên đấu giá <span aria-hidden="true">→</span>
        </Link>
      </div>
      {loading ? <p role="status">Đang tải sản phẩm…</p> : error ? <p role="alert">{error}</p> : <HomeProductPager products={auctionProducts} label="Đấu giá trực tiếp" />}
    </section>
  );
}

export default NewArrivals;
