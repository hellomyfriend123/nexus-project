
import type { CreateListingState } from '../hooks/useCreateListing';

function shortWarranty(value: string) {
  const months = value.match(/(\d+)\s*tháng/i);
  return months ? `BH ${months[1]} tháng` : value;
}

// Aside 2 — Mô phỏng thẻ sản phẩm như người mua nhìn thấy trên sàn.
export default function ListingPreviewCard({ hub }: { hub: CreateListingState }) {
  const { draft } = hub;
  const cover = hub.media[0];
  const hasOffer = hub.saleModes.includes('offer');

  return (
    <section className="nx-listing-card nx-listing-aside-card">
      <header className="nx-listing-aside-head">
        <h3 className="nx-listing-aside-head-title">
          <i className="bi bi-eye" aria-hidden="true" />
          Xem trước hiển thị
        </h3>
        <span className="nx-listing-aside-note">Chỉ xem trước — chưa lưu</span>
      </header>
      <p className="nx-listing-aside-desc">
        Đây là cách người mua nhìn thấy tin đăng của bạn trên sàn:
      </p>

      <article className="nx-listing-preview">
        <div className="nx-listing-preview-media">
          <img src={cover?.image} alt="Ảnh xem trước sản phẩm" />
          <div className="nx-listing-preview-badges">
            <span className="nx-listing-preview-tag is-blue">Like New 99%</span>
            {hub.discountPercent > 0 && (
              <span className="nx-listing-preview-tag is-red">-{hub.discountPercent}% OFF</span>
            )}
          </div>
          <button type="button" className="nx-listing-preview-heart" onClick={() => hub.mockAction('Yêu thích')}>
            <i className="bi bi-heart" aria-hidden="true" />
          </button>
          <div className="nx-listing-preview-footer">
            <span className="nx-listing-preview-verified">
              <i className="bi bi-patch-check-fill" aria-hidden="true" />
              Chưa xác minh seri
            </span>
            <span className="nx-listing-preview-city">—</span>
          </div>
        </div>
        <div className="nx-listing-preview-body">
          <h4>{draft.title}</h4>
          <p className="nx-listing-preview-specs">
            <span>{draft.shutter}</span>
            <span>•</span>
            <span>{shortWarranty(draft.warranty)}</span>
          </p>
          <p className="nx-listing-preview-price">
            <strong>{hub.formatted.dealPrice}</strong>
            <s>{hub.formatted.price}</s>
          </p>
          <div className="nx-listing-preview-meta">
            <span>
              <i className="bi bi-image" aria-hidden="true" />
              Nexus Escrow 100%
            </span>
            {hasOffer && <em>Có trả giá</em>}
          </div>
          <div className="nx-listing-preview-actions">
            <button type="button" onClick={() => hub.mockAction('Trả giá')}>Trả giá</button>
            <button type="button" className="is-primary" onClick={() => hub.mockAction('Mua ngay')}>
              Mua ngay
            </button>
          </div>
        </div>
      </article>
    </section>
  );
}
