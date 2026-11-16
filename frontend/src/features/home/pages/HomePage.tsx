import { useState } from 'react';
import HeroBanner from '../components/HeroBanner';
import FeaturedCategories from '../components/FeaturedCategories';
import NewArrivals from '../components/NewArrivals';
import BestSellers from '../components/BestSellers';
import PromotionSection from '../components/PromotionSection';

type HomeFilter = 'all' | 'auction' | 'buy-now';

const filters: { id: HomeFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả sản phẩm' },
  { id: 'auction', label: 'Đấu giá trực tiếp' },
  { id: 'buy-now', label: 'Mua ngay' },
];

function HomePage() {
  const [filter, setFilter] = useState<HomeFilter>('all');

  return (
    <main className="nx-home">
      <div className="nx-flash-bar">
        <b>CYBER SEASON</b> Cơ hội săn linh kiện điện tử với mức giá độc quyền ·
        Miễn phí vận chuyển cho hội viên hôm nay! <span>Ưu đãi mô phỏng</span>
      </div>
      <div className="nx-container">
        <HeroBanner />
        <FeaturedCategories />

        <div className="nx-home-discovery">
          <div>
            <span className="nx-section-kicker">KHÁM PHÁ CÙNG NEXUS</span>
            <h2>Tìm món đồ công nghệ tiếp theo của bạn</h2>
          </div>
          <div
            className="nx-home-tabs"
            role="group"
            aria-label="Lọc hình thức mua hàng"
          >
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`nx-home-tab${filter === item.id ? ' is-active' : ''}`}
                aria-pressed={filter === item.id}
                onClick={() => setFilter(item.id)}
              >
                {item.id === 'auction' && <span className="nx-live-dot" />}
                {item.label}
              </button>
            ))}
          </div>
        </div>
        {filter !== 'buy-now' && <NewArrivals />}
        {filter !== 'auction' && <BestSellers />}
        <PromotionSection />
      </div>
    </main>
  );
}

export default HomePage;
