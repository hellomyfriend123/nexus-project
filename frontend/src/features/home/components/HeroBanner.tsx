import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../product/services/productService';
import { useHomeProducts } from '../hooks/useHomeProducts';
import { notify } from '../../../shared/components/Toast';
import { CatalogImage } from '../../product/components/CatalogProductCard';

function HeroBanner() {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const { products } = useHomeProducts();
  const featured = products[0];
  function copyCoupon() { setCopied(false); setCopyError(true); notify.error('Chưa có API công bố ưu đãi này. Không thể xác nhận mã NEXUS10.'); }


  return (
    <section className="nx-hero" aria-labelledby="home-hero-title">
      <div className="nx-hero-copy">
        <span className="nx-eyebrow">
          <span className="nx-live-dot" /> GIẢI ƯU ĐÃI THÁNG 11 · NEXUS CYBER
          WEEK
        </span>
        <h1 id="home-hero-title">
          Đại tiệc Giảm 10%
          <br />
          <span>Phụ tùng & Linh kiện Điện tử</span>
        </h1>
        <p>
          Nâng cấp bộ máy chiến game và trạm làm việc của bạn. Hàng nghìn phụ
          tùng máy tính, CPU, GPU, bàn phím cơ dành cho chính hãng đang có mức
          trợ giá độc quyền.
        </p>
        <div className="nx-hero-actions">
          <Link
            className="nx-button nx-button-primary"
            to="/categories/all?mode=auction"
          >
            Khám phá đấu giá <span aria-hidden="true">↗</span>
          </Link>
          <Link
            className="nx-button nx-button-light"
            to="/categories/all?mode=buy-now"
          >
            Mua ngay <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="nx-coupon">
          <span className="nx-coupon-icon" aria-hidden="true">
            ✧
          </span>
          <span>
            Giảm <strong>10%</strong> cho đơn hàng đầu tiên
          </span>
          <button
            type="button"
            onClick={copyCoupon}
            aria-label="Sao chép mã giảm giá NEXUS10"
          >
            {copied ? 'ĐÃ SAO CHÉP ✓' : 'NEXUS10 ⧉'}
          </button>
        </div>
        <span className="nx-coupon-feedback" role="status">
          {copyError
            ? 'Mã ưu đãi của bạn: NEXUS10. Mã chưa được máy chủ xác nhận; không đảm bảo áp dụng.'
            : copied
              ? 'Đã sao chép mã NEXUS10. Không đảm bảo áp dụng mã.'
              : ''}
        </span>
      </div>
      <div className="nx-hero-visual">
        <div className="nx-hero-orbit" aria-hidden="true" />
        <span className="nx-hero-floating nx-hero-floating-top">
          ✦ HIỆU NĂNG VƯỢT TRỘI
        </span>
        {featured && (
          <Link
            className="nx-hero-product"
            to={`/products/${featured.id}`}
            aria-label={`Khám phá ${featured.name}`}
          >
            <CatalogImage url={featured.primaryImageUrl} name={featured.name} />
          </Link>
        )}
        {featured ? (
          <div className="nx-hero-price">
            <span className="nx-hero-price-label">
              <span className="nx-live-dot" /> HOT ITEM
            </span>
            <strong>{featured.name}</strong>
            <div>
              <span>Giá hiện tại</span>
              <b>{formatPrice(featured.basePrice)}</b>
            </div>
            <span className="nx-hero-price-note">
              Cơ hội nâng cấp góc máy của bạn <span aria-hidden="true">↗</span>
            </span>
          </div>
        ) : (
          <div className="nx-hero-price" role="status">
            <strong>Chưa có sản phẩm nổi bật</strong>
            <p>Sản phẩm sẽ hiển thị khi có dữ liệu.</p>
          </div>
        )}
        <span className="nx-hero-spark nx-hero-spark-one" aria-hidden="true">
          ✦
        </span>
        <span className="nx-hero-spark nx-hero-spark-two" aria-hidden="true">
          +
        </span>
      </div>
    </section>
  );
}

export default HeroBanner;
