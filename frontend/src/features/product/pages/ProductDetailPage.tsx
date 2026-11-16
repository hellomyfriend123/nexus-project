import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { products, formatPrice } from '../services/productService';
import { categories } from '../../category/services/categoryService';
import ProductImage from '../components/ProductImage';
import ProductAssurance from '../components/ProductAssurance';
import HeartBurstButton from '../../../shared/components/Button/HeartBurstButton';
import useAddToCartAnimation from '../hooks/useAddToCartAnimation';
import '../styles/product-detail-animation.css';

// UI-only auction simulation. No payments, persisted cart, or actual bids.
function ProductDetailPage() {
  const { productId } = useParams();
  const product = products.find((p) => p.id === productId);
  if (!product)
    return (
      <main className="nx-container nx-empty">
        <h1>Không tìm thấy sản phẩm</h1>
        <Link to="/categories/all">Khám phá sản phẩm →</Link>
      </main>
    );
  return <ProductDetail key={product.id} product={product} />;
}
function ProductDetail({ product }: { product: (typeof products)[number] }) {
  const [image, setImage] = useState(0),
    [saved, setSaved] = useState(false),
    [mode, setMode] = useState(product.mode),
    [price, setPrice] = useState(product.price),
    [bid, setBid] = useState(product.price + 200000),
    [notice, setNotice] = useState(''),
    [history, setHistory] = useState<number[]>([]),
    [reviews, setReviews] = useState(false);
  const { added, count, stageRef, imageRef, cartRef, badgeRef, addToCart } =
    useAddToCartAnimation(() => {
      setNotice(
        'Đã thêm sản phẩm vào giỏ mô phỏng. Chưa triển khai thanh toán.',
      );
    });
  const category = categories.find((c) => c.id === product.categoryId);
  const auction = mode === 'auction';
  const submitBid = () => {
    if (!Number.isFinite(bid) || bid < price + 200000) {
      setNotice('Giá đặt phải cao hơn giá hiện tại ít nhất 200.000 ₫.');
      return;
    }
    setPrice(bid);
    setHistory([bid, ...history]);
    setBid(bid + 200000);
    setNotice('Đã ghi nhận giá thầu mô phỏng. Không có giao dịch thật.');
  };
  return (
    <main ref={stageRef} className="nx-container nx-detail-page u051-detail">
      <div className="nx-detail-actions">
        {!auction && (
          <button
            ref={cartRef}
            type="button"
            className="u051-detail-cart"
            aria-label={`Giỏ mô phỏng, ${count} sản phẩm`}
            onClick={() =>
              setNotice(
                `Giỏ chi tiết có ${count} sản phẩm mô phỏng. Chưa kết nối giỏ Header.`,
              )
            }
          >
            🛒 Giỏ mô phỏng <b ref={badgeRef}>{count}</b>
          </button>
        )}
        <HeartBurstButton
          pressed={saved}
          onToggle={() => setSaved(!saved)}
          label={saved ? 'Bỏ lưu vào Watchlist' : 'Lưu vào Watchlist'}
          text={saved ? 'Đã lưu' : 'Lưu vào Watchlist'}
          count={142 + (saved ? 1 : 0)}
        />
        <button
          onClick={() => setNotice('Chia sẻ chưa được kết nối trong bản mock.')}
        >
          ↗ Chia sẻ
        </button>
      </div>
      <div className="nx-detail-grid">
        <section className="nx-gallery">
          <div className="nx-gallery-main">
            <div className="nx-gallery-badges">
              <b>{product.badge}</b>
              <span>◉ Ảnh minh họa</span>
            </div>
            <div
              ref={imageRef}
              style={{ transform: `scale(${1 + image * 0.035})` }}
            >
              <ProductImage
                kind={product.image}
                label={`${product.name}, góc ${image + 1}`}
              />
            </div>
            <div className="nx-authenticated">
              ◉ <strong>Đã kiểm định Nexus Authenticated</strong>
              <small>
                Placeholder dùng chung cho các góc ảnh; chưa có ảnh sản phẩm
                gốc.
              </small>
            </div>
          </div>
          <div className="nx-thumbnails">
            {[0, 1, 2, 3].map((n) => (
              <button
                key={n}
                className={image === n ? 'is-active' : ''}
                onClick={() => setImage(n)}
                aria-label={`Xem ảnh minh họa ${n + 1}`}
                aria-pressed={image === n}
              >
                <ProductImage
                  kind={product.image}
                  label={`Ảnh minh họa ${n + 1}`}
                />
              </button>
            ))}
          </div>
          <div className="nx-panel nx-condition">
            <h3>TÓM TẮT KIỂM ĐỊNH PHẦN CỨNG</h3>
            <div>
              ✓ Thân vỏ: 99% hoàn hảo <span>✓ Vòng xoay: Êm mượt</span>
            </div>
            <div>
              ✓ Lá khẩu: Sạch, trơn <span>✓ Ngoại hình: Sẵn sàng</span>
            </div>
          </div>
        </section>
        <section className="nx-panel nx-purchase">
          <span className="nx-eyebrow">
            AIS Serial: 398241 · Mã niêm yết: NX-88204
          </span>
          <h1>{product.name}</h1>
          <p className="nx-muted">
            Sản phẩm được kiểm định bởi Nexus, sẵn sàng đồng hành cùng bạn.
            Thông tin và giá trong trang này là dữ liệu mẫu.
          </p>
          <div className="nx-seller">
            <span className="nx-avatar">CH</span>
            <div>
              <b>CameraHub VN ◉</b>
              <small>★ 4.95/5 (642 đánh giá)</small>
              <small>Người bán uy tín Top Rated</small>
            </div>
            <button
              onClick={() => setNotice('Nhắn tin người bán chưa triển khai.')}
            >
              ✉ Nhắn tin
            </button>
          </div>
          <div className="nx-bid-warning">
            ⚠ Chú ý: Bản mô phỏng UI. Không phát sinh đấu giá hoặc thanh toán
            thực tế.
          </div>
          <div className="nx-purchase-tabs">
            <button aria-pressed={auction} onClick={() => setMode('auction')}>
              ● Đấu giá trực tiếp
            </button>
            <button aria-pressed={!auction} onClick={() => setMode('buy-now')}>
              ♙ Mua đứt (Buy It Now)
            </button>
          </div>
          {auction && (
            <div className="nx-auction-clock">
              <strong>● PHIÊN ĐẤU ĐANG DIỄN RA</strong>
              <span>{product.bids + history.length} lượt đấu</span>
              <p>THỜI GIAN CÒN LẠI (MẪU)</p>
              <b>
                02 <small>giờ</small> : 14 <small>phút</small> : 44{' '}
                <small>giây</small>
              </b>
            </div>
          )}
          <div className="nx-detail-price">
            <div>
              <small>Giá khởi điểm:</small>
              <b>{formatPrice(product.originalPrice)}</b>
            </div>
            <div>
              <small>
                {auction ? 'Giá cao nhất hiện tại:' : 'Giá mua ngay:'}
              </small>
              <strong>{formatPrice(price)}</strong>
              <small>Chưa bao gồm phí vận chuyển</small>
            </div>
          </div>
          {auction && (
            <>
              <label className="nx-bid-label" htmlFor="bid-price">
                Giá thầu của bạn <small>Bước giá: 200.000 ₫</small>
              </label>
              <input
                className="nx-bid-input"
                id="bid-price"
                type="number"
                min={price + 200000}
                step={200000}
                value={bid}
                onChange={(e) => setBid(Number(e.target.value))}
              />
              <div className="nx-bid-increments">
                {[200000, 500000, 1000000].map((n) => (
                  <button
                    key={n}
                    onClick={() => setBid(Math.max(price, bid) + n)}
                  >
                    +{formatPrice(n)}
                  </button>
                ))}
              </div>
            </>
          )}
          <button
            type="button"
            className="nx-button nx-button-primary nx-purchase-button"
            onClick={auction ? submitBid : addToCart}
          >
            {auction
              ? '♧ Đặt Giá Thầu (Place Bid)'
              : added
                ? '✓ Đã thêm (mô phỏng)'
                : '🛒 Thêm vào giỏ (mô phỏng)'}
          </button>
          <details className="nx-history">
            <summary>
              Xem lịch sử đấu giá ({product.bids + history.length} lượt ra giá)
            </summary>
            {history.length ? (
              history.map((n, i) => (
                <p key={i}>Bạn (mock) · {formatPrice(n)}</p>
              ))
            ) : (
              <p>Chưa có giá thầu mô phỏng trong phiên này.</p>
            )}
          </details>
          {notice && (
            <p role="status" className="nx-notice">
              {notice}
            </p>
          )}
        </section>
        <ProductAssurance />
      </div>
      <div className="nx-detail-bottom">
        <div>
          <section className="nx-panel nx-description">
            <h2>Chi tiết sản phẩm & Đánh giá thợ máy</h2>
            <h3>{product.name}</h3>
            <p>
              Thiết kế tinh tế, chất lượng được kiểm tra kỹ lưỡng trước khi niêm
              yết trên Nexus. Sản phẩm phù hợp với người dùng yêu thích trải
              nghiệm công nghệ và giá trị bền vững.
            </p>
            <p>
              Thông tin mô tả, tình trạng và đánh giá dưới đây là nội dung mẫu.
              Chưa có kết nối tới dữ liệu người bán hoặc kết quả kiểm định thực
              tế.
            </p>
            <div className="nx-description-highlights">
              <div>
                <h3>◉ Điểm nổi bật</h3>
                <p>• Ngoại hình đẹp, hoạt động ổn định.</p>
                <p>• Kiểm tra kỹ trước khi giao hàng.</p>
                <p>• Đóng gói an toàn theo tiêu chuẩn.</p>
              </div>
              <div>
                <h3>📦 Trong bộ phụ kiện đi kèm</h3>
                <p>• Sản phẩm và phụ kiện cơ bản.</p>
                <p>• Phiếu kiểm định mẫu Nexus.</p>
                <p>• Hộp bảo vệ chống va đập.</p>
              </div>
            </div>
          </section>
          <section className="nx-panel nx-specs">
            <h2>Thông số kỹ thuật chi tiết</h2>
            <table>
              <tbody>
                {(product.image === 'lens'
                  ? [
                      ['Ngàm ống kính (Mount)', 'Nikon F-mount (AIS)'],
                      ['Tiêu cự', '50mm (Chuẩn Full-frame)'],
                      ['Khẩu độ tối đa – tối thiểu', 'f/1.2 – f/16'],
                      ['Cấu tạo quang học', '7 thấu kính trong 6 nhóm'],
                      ['Số lá khẩu', '9 lá khẩu cong'],
                      ['Khoảng cách lấy nét gần nhất', '0.5 mét (1.7 feet)'],
                      ['Đường kính Filter', '52mm'],
                    ]
                  : [
                      ['Danh mục', category?.name || 'Công nghệ'],
                      ['Tình trạng', 'Like New 99% (mẫu)'],
                      ['Bảo hành', '06 tháng (mẫu)'],
                      ['Thương hiệu', 'Theo thông tin sản phẩm'],
                      ['Phụ kiện', 'Bộ phụ kiện cơ bản'],
                    ]
                ).map(([key, value]) => (
                  <tr key={key}>
                    <th>{key}</th>
                    <td>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
        <aside className="nx-panel nx-reviews">
          <div className="nx-section-heading">
            <h2>Đánh giá từ người mua</h2>
            <strong>
              4.9 <small>★★★★★</small>
            </strong>
          </div>
          <p className="nx-muted">Dựa trên 842 giao dịch hoàn tất (mẫu)</p>
          {[94, 5, 1].map((n, i) => (
            <div className="nx-rating-bar" key={n}>
              <span>{5 - i} sao</span>
              <div>
                <span style={{ width: `${n}%` }} />
              </div>
              <span>{n}%</span>
            </div>
          ))}
          {[
            'Trần Minh Quân',
            'Hoàng Nam Designer',
            ...(reviews ? ['Nguyễn Hà', 'Phạm Anh'] : []),
          ].map((name, i) => (
            <article className="nx-review" key={name}>
              <b>{name}</b>
              <small>{i + 1} ngày trước</small>
              <div className="nx-stars">★★★★★</div>
              <p>
                Đóng gói cẩn thận, sản phẩm đúng mô tả. Trải nghiệm giao dịch
                rất tốt! (Đánh giá mẫu)
              </p>
            </article>
          ))}
          <button
            className="nx-button nx-button-soft"
            onClick={() => setReviews(!reviews)}
          >
            {reviews ? 'Thu gọn đánh giá' : 'Xem thêm đánh giá mẫu'}
          </button>
        </aside>
      </div>
    </main>
  );
}

export default ProductDetailPage;
