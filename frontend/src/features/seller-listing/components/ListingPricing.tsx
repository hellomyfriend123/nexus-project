import { listingSaleModes } from '../constants/createListing.constants';
import type { CreateListingState } from '../hooks/useCreateListing';

// Bước 4 — Phương thức bán, định giá và số lượng kho.
export default function ListingPricing({ hub }: { hub: CreateListingState }) {
  const { draft } = hub;
  return (
    <div className="nx-listing-stack">
      <div className="nx-listing-modes">
        {listingSaleModes.map(mode => {
          const checked = hub.saleModes.includes(mode.id);
          return (
            <label key={mode.id} className="nx-listing-mode">
              <input type="checkbox" checked={checked} onChange={() => hub.toggleSaleMode(mode.id)} />
              <span>
                <span className="nx-listing-mode-title">
                  {mode.title}
                  <em className={`nx-listing-mode-badge is-${mode.badgeTone}`}>{mode.badge}</em>
                </span>
                <span className="nx-listing-mode-caption">{mode.caption}</span>
              </span>
            </label>
          );
        })}
      </div>

      <div className="nx-listing-price-grid">
        <div>
          <label htmlFor="listing-price" className="nx-listing-label">
            Giá niêm yết ban đầu <em>*</em>
          </label>
          <div className="nx-listing-price">
            <input
              id="listing-price"
              type="number"
              value={draft.price}
              onChange={event => hub.updateDraft('price', Number(event.target.value))}
            />
            <span>đ</span>
          </div>
        </div>
        <div>
          <div className="nx-listing-label-row">
            <label htmlFor="listing-deal" className="nx-listing-label">Giá bán ưu đãi (Deal)</label>
            <span className="nx-listing-off">-{hub.discountPercent}% OFF</span>
          </div>
          <div className="nx-listing-price is-secondary">
            <input
              id="listing-deal"
              type="number"
              value={draft.dealPrice}
              onChange={event => hub.updateDraft('dealPrice', Number(event.target.value))}
            />
            <span>đ</span>
          </div>
        </div>
        <div>
          <label htmlFor="listing-min-offer" className="nx-listing-label">Ngưỡng trả giá tối thiểu</label>
          <div className="nx-listing-price">
            <input
              id="listing-min-offer"
              type="number"
              value={draft.minOffer}
              onChange={event => hub.updateDraft('minOffer', Number(event.target.value))}
            />
            <span>đ</span>
          </div>
          <p className="nx-listing-price-note">
            Tự động từ chối nếu trả dưới {Math.round(draft.minOffer / 1000000)}tr
          </p>
        </div>
      </div>

      <div className="nx-listing-stock">
        <div className="nx-listing-stock-main">
          <i className="bi bi-box-seam" aria-hidden="true" />
          <div>
            <p>
              Số lượng sản phẩm trong kho:{' '}
              <strong>{String(draft.quantity).padStart(2, '0')} chiếc</strong>
            </p>
            <span>Sản phẩm sưu tầm / cá nhân đơn chiếc, tự động đóng tin khi bán xong</span>
          </div>
        </div>
        <div className="nx-listing-stepper">
          <button type="button" onClick={() => hub.changeQuantity(-1)} aria-label="Giảm số lượng">-</button>
          <span>{draft.quantity}</span>
          <button type="button" onClick={() => hub.changeQuantity(1)} aria-label="Tăng số lượng">+</button>
        </div>
      </div>
    </div>
  );
}
