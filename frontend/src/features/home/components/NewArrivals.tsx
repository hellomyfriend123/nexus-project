import { Link } from 'react-router-dom';
import { products } from '../../product/services/productService';
import HomeProductPager from './HomeProductPager';

function NewArrivals() {
  const auctionProducts = products.filter(
    (product) => product.mode === 'auction',
  );

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
      <HomeProductPager products={auctionProducts} label="Đấu giá trực tiếp" />
    </section>
  );
}

export default NewArrivals;
