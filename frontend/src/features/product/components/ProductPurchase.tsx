import { useRef, useState } from 'react';
import type { CatalogProductDetail } from '../../../services/api/catalog';
import type { useProductDetail } from '../hooks/useProductDetail';
import { formatPrice } from '../services/productService';
import { getSession } from '../../../services/api/auth';
import { commerceApi } from '../../../services/api/commerce';
import { apiErrorMessage } from '../../../services/api/client';
import { notify } from '../../../shared/components/Toast';
import RichTextContent from '../../../shared/components/RichText/RichTextContent';

type Props = { product: CatalogProductDetail; detail: ReturnType<typeof useProductDetail> };

export default function ProductPurchase({ product, detail }: Props) {
  const {
    navigate,
    auction,
    active,
    remaining,
    bid,
    setBid,
    quantity,
    setQuantity,
    pending,
    bidRefreshFailed,
    submitBid,
    addToCart,
    notice,
    bidError,
    bids,
    bidPage,
    setBidPage,
  } = detail;

  const session = getSession();
  const isReadOnlyRole = Boolean(
    session?.roles?.includes('SELLER') || session?.roles?.includes('ADMIN'),
  );
  const lock = useRef(false);
  const [buying, setBuying] = useState(false);

  async function handleCartAction(goToCart: boolean) {
    if (lock.current) return;
    const current = getSession();
    if (!current) {
      notify.info('Vui lòng đăng nhập tài khoản người mua để tiếp tục.');
      navigate('/login');
      return;
    }
    if (!current.roles.includes('BUYER')) {
      notify.error('Chỉ tài khoản có vai trò người mua mới được mua hàng.');
      return;
    }
    if (!Number.isFinite(product.basePrice) || product.basePrice <= 0) {
      notify.warning('Sản phẩm chưa có giá mua hợp lệ.');
      return;
    }
    lock.current = true;
    setBuying(true);
    try {
      await commerceApi.add({
        productId: product.id,
        sellerId: product.sellerId,
        productName: product.name,
        quantity,
        unitPrice: product.basePrice,
      });
      window.dispatchEvent(new Event('nexus:cart-changed'));
      if (goToCart) {
        navigate('/cart');
      } else {
        notify.success('Đã thêm sản phẩm vào giỏ hàng.');
        addToCart();
      }
    } catch (error) {
      notify.error(apiErrorMessage(error));
    } finally {
      lock.current = false;
      setBuying(false);
    }
  }

  return (
    <section className="nx-panel nx-purchase">
      {/* Badge Yêu thích+ & Danh mục */}
      <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
        <span
          className="badge"
          style={{
            backgroundColor: '#ee4d2d',
            color: '#fff',
            fontSize: 11,
            padding: '4px 8px',
            borderRadius: 3,
          }}
        >
          Yêu thích+
        </span>
        <span className="nx-eyebrow mb-0">
          Danh mục: {product.categoryName || 'Sản phẩm'}
        </span>
      </div>

      {/* Tên sản phẩm */}
      <h1 className="fw-semibold text-dark mb-2" style={{ fontSize: 21, lineHeight: 1.4 }}>
        {product.name}
      </h1>

      {/* Dòng đánh giá & lượt bán */}
      <div className="d-flex align-items-center gap-3 small text-secondary pb-3 border-bottom">
        <div className="d-flex align-items-center gap-1 text-danger">
          <span className="fw-bold border-bottom border-danger pb-0">5.0</span>
          <span>★★★★★</span>
        </div>
        <span className="text-muted">|</span>
        <div>
          <strong className="text-dark">642</strong> <span className="text-muted">Đánh Giá</span>
        </div>
        <span className="text-muted">|</span>
        <div>
          <strong className="text-dark">1.2k</strong> <span className="text-muted">Đã bán</span>
        </div>
      </div>

      {/* Đồng hồ đấu giá nếu là sản phẩm đấu giá */}
      {auction && (
        <div className="nx-auction-clock">
          <strong>{active ? '● PHIÊN ĐẤU ĐANG DIỄN RA' : auction.status}</strong>
          <span>{auction.acceptedBidCount ?? 0} lượt đấu</span>
          <p>THỜI GIAN CÒN LẠI</p>
          <b>
            {Math.floor(remaining / 3600000)} <small>giờ</small> :{' '}
            {Math.floor(remaining / 60000) % 60} <small>phút</small> :{' '}
            {Math.floor(remaining / 1000) % 60} <small>giây</small>
          </b>
        </div>
      )}

      {/* Khung giá chuẩn Shopee */}
      <div className="nx-shopee-price-box">
        <div className="d-flex flex-wrap align-items-baseline gap-2 mb-1">
          <span className="nx-shopee-price-main">
            {formatPrice(auction?.currentPrice ?? product.basePrice)}
          </span>
          <span
            className="badge"
            style={{
              backgroundColor: '#ffeae8',
              color: '#ee4d2d',
              border: '1px solid #ee4d2d',
              fontSize: 11,
              padding: '3px 8px',
            }}
          >
            {auction ? 'Giá hiện tại' : 'Giá ưu đãi'}
          </span>
        </div>
        {auction && (
          <div className="small text-secondary mt-1">
            Giá khởi điểm: <strong className="text-dark">{formatPrice(auction.startingPrice)}</strong>
          </div>
        )}
      </div>

      {/* Vận chuyển */}
      <div className="nx-shopee-row">
        <div className="nx-shopee-label">Vận Chuyển</div>
        <div className="nx-shopee-content">
          <div className="d-flex align-items-center gap-2 text-dark small fw-medium mb-1">
            <span>🚚 Miễn phí vận chuyển</span>
            <span className="text-muted fw-normal">(cho đơn hàng từ 0₫)</span>
          </div>
          <div className="text-muted small">
            Giao hàng toàn quốc · Thời gian dự kiến 2 - 3 ngày
          </div>
        </div>
      </div>

      {/* Mô tả sản phẩm */}
      <div className="nx-shopee-row">
        <div className="nx-shopee-label">Mô Tả</div>
        <div className="nx-shopee-content text-dark" style={{ lineHeight: 1.6 }}>
          <RichTextContent
            className="nx-description-content"
            value={product.description}
            fallback="Chưa có mô tả từ người bán."
          />
        </div>
      </div>

      {/* Số lượng */}
      {!auction && !isReadOnlyRole && (
        <div className="nx-shopee-row align-items-center">
          <div className="nx-shopee-label">Số Lượng</div>
          <div className="nx-shopee-content d-flex align-items-center gap-3">
            <div className="nx-shopee-stepper">
              <button
                type="button"
                className="nx-shopee-stepper-btn"
                disabled={quantity <= 1}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Giảm số lượng"
              >
                −
              </button>
              <span className="nx-shopee-stepper-val">{quantity}</span>
              <button
                type="button"
                className="nx-shopee-stepper-btn"
                onClick={() => setQuantity(quantity + 1)}
                aria-label="Tăng số lượng"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Đấu giá */}
      {auction && !isReadOnlyRole && (
        <>
          <label className="nx-bid-label" htmlFor="bid-price">
            Giá thầu của bạn
          </label>
          <input
            className="nx-bid-input"
            id="bid-price"
            type="number"
            min={auction.currentPrice}
            value={bid}
            onChange={(event) => setBid(Number(event.target.value))}
          />
          <div className="nx-bid-increments">
            {[10000, 50000, 100000].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setBid(Math.max(bid, auction.currentPrice) + value)}
              >
                +{formatPrice(value)}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Nút thao tác */}
      {isReadOnlyRole ? (
        <div className="alert alert-light border text-muted small my-4 py-2 px-3 rounded-3">
          🔍 <strong>Chế độ xem tham khảo:</strong> Tài khoản Seller / Admin chỉ xem thông tin sản phẩm trên sàn, không thực hiện thêm vào giỏ hoặc đặt mua.
        </div>
      ) : (
        <div className="d-flex gap-3 my-4">
          {!auction && (
            <button
              type="button"
              className="btn d-flex align-items-center justify-content-center gap-2 fw-semibold"
              style={{
                flex: 1,
                height: 48,
                borderRadius: 4,
                fontSize: 15,
                backgroundColor: 'rgba(238, 77, 45, 0.08)',
                borderColor: '#ee4d2d',
                color: '#ee4d2d',
              }}
              disabled={buying || product.status !== 'ACTIVE' || product.basePrice <= 0}
              onClick={() => void handleCartAction(false)}
            >
              <span>🛒</span>
              <span>{buying ? 'Đang thêm…' : 'Thêm Vào Giỏ Hàng'}</span>
            </button>
          )}

          <button
            type="button"
            className="btn d-flex align-items-center justify-content-center gap-2 fw-bold text-white shadow-sm"
            style={{
              flex: 1,
              height: 48,
              borderRadius: 4,
              fontSize: 15,
              backgroundColor: '#ee4d2d',
              borderColor: '#ee4d2d',
            }}
            disabled={
              auction
                ? pending || !active || bidRefreshFailed
                : buying || product.status !== 'ACTIVE' || product.basePrice <= 0
            }
            onClick={auction ? submitBid : () => void handleCartAction(true)}
          >
            {auction ? (pending ? 'Đang gửi…' : '♧ Đặt Giá Thầu (Place Bid)') : 'Mua Ngay'}
          </button>
        </div>
      )}

      {notice && (
        <p className="nx-notice" role="status">
          {notice}
        </p>
      )}

      {auction && (
        <details className="nx-history">
          <summary>Lịch sử đặt giá</summary>
          {bidError ? (
            <p role="alert">{bidError}</p>
          ) : !bids ? (
            <p role="status">Đang tải…</p>
          ) : (
            <>
              {bids.content.length ? (
                bids.content.map((item) => (
                  <p key={item.id}>
                    {item.bidderId}: <b>{formatPrice(item.amount)}</b> ·{' '}
                    {new Date(item.placedAt).toLocaleString('vi-VN')}
                  </p>
                ))
              ) : (
                <p>Chưa có giá thầu.</p>
              )}
              <button
                type="button"
                disabled={bidPage === 0}
                onClick={() => setBidPage((value) => value - 1)}
              >
                Trước
              </button>
              <button
                type="button"
                disabled={bidPage + 1 >= bids.totalPages}
                onClick={() => setBidPage((value) => value + 1)}
              >
                Tiếp
              </button>
            </>
          )}
        </details>
      )}
    </section>
  );
}
