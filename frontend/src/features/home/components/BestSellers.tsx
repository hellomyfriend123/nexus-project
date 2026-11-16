import { Link } from 'react-router-dom';
import { products } from '../../product/services/productService';
import HomeProductPager from './HomeProductPager';

function BestSellers() {
  const buyNowProducts = products.filter(
    (product) => product.mode === 'buy-now',
  );

  return (
    <section className="nx-section" aria-labelledby="home-buy-now-title">
      <div className="nx-section-heading">
        <div>
          <h2 id="home-buy-now-title">
            <span className="nx-heading-icon" aria-hidden="true">
              ▣
            </span>{' '}
            Mua Trực Tiếp - Giá Tốt Hôm Nay
          </h2>
          <p>
            Không cần chờ đợi. Chọn sản phẩm yêu thích và sở hữu ngay hôm nay.
          </p>
        </div>
        <Link to="/categories/all?mode=buy-now" className="nx-section-link">
          Xem tất cả sản phẩm <span aria-hidden="true">→</span>
        </Link>
      </div>
      <HomeProductPager products={buyNowProducts} label="Mua trực tiếp" />
    </section>
  );
}

export default BestSellers;
