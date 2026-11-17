import { useListingShipping } from '../hooks/useListingShipping';
import { listingShippingMethods } from '../services/listingShipping.mock';
import type { CreateListingState } from '../hooks/useCreateListing';

// Bước 5 — Kho gửi hàng, kích thước đóng gói và phương thức vận chuyển.
export default function ListingShipping({ hub }: { hub: CreateListingState }) {
  const { draft } = hub;
  const {methods,toggleMethod}=useListingShipping();

  return (
    <div className="nx-listing-stack">
      <div className="nx-listing-warehouse">
        <div className="nx-listing-warehouse-main">
          <i className="bi bi-building" aria-hidden="true" />
          <div>
            <p>Kho hàng lấy hàng: Hub Cầu Giấy (Hà Nội)</p>
            <span>
              Số 18 Phố Duy Tân, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội | Liên hệ: 0988.xxx.899
            </span>
          </div>
        </div>
        <button type="button" onClick={() => hub.mockAction('Đổi địa chỉ kho')}>Đổi địa chỉ</button>
      </div>

      <div className="nx-listing-dims">
        <div>
          <label htmlFor="listing-weight" className="nx-listing-mini-label">Cân nặng sau đóng gói</label>
          <input
            id="listing-weight"
            type="text"
            className="nx-listing-input is-compact"
            value={draft.weight}
            onChange={event => hub.updateDraft('weight', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="listing-length" className="nx-listing-mini-label">Dài (cm)</label>
          <input
            id="listing-length"
            type="text"
            className="nx-listing-input is-compact"
            value={draft.length}
            onChange={event => hub.updateDraft('length', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="listing-width" className="nx-listing-mini-label">Rộng (cm)</label>
          <input
            id="listing-width"
            type="text"
            className="nx-listing-input is-compact"
            value={draft.width}
            onChange={event => hub.updateDraft('width', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="listing-height" className="nx-listing-mini-label">Cao (cm)</label>
          <input
            id="listing-height"
            type="text"
            className="nx-listing-input is-compact"
            value={draft.height}
            onChange={event => hub.updateDraft('height', event.target.value)}
          />
        </div>
      </div>

      <div className="nx-listing-stack is-tight">
        {listingShippingMethods.map(method => (
          <div key={method.id} className="nx-listing-ship">
            <label className="nx-listing-ship-main">
              <input
                type="checkbox"
                checked={methods.includes(method.id)}
                onChange={() => toggleMethod(method.id)}
              />
              <span>
                <span className="nx-listing-ship-title">
                  {method.title}
                  {method.badge && <em>{method.badge}</em>}
                </span>
                <span className="nx-listing-ship-caption">{method.caption}</span>
              </span>
            </label>
            <span className="nx-listing-ship-fee">{method.fee}</span>
          </div>
        ))}
      </div>

      <div className="nx-listing-payer">
        <div className="nx-listing-payer-main">
          <i className="bi bi-truck" aria-hidden="true" />
          <div>
            <p>Phí vận chuyển:</p>
            <span>Bạn chọn Người mua chịu phí vận chuyển theo biểu phí nhà xe/bưu cục</span>
          </div>
        </div>
        <div className="nx-listing-payer-options">
          <label>
            <input
              type="radio"
              name="shipping_payer"
              checked={hub.shippingPayer === 'buyer'}
              onChange={() => hub.setShippingPayer('buyer')}
            />
            Người mua trả
          </label>
          <label>
            <input
              type="radio"
              name="shipping_payer"
              checked={hub.shippingPayer === 'seller'}
              onChange={() => hub.setShippingPayer('seller')}
            />
            Tôi miễn phí ship (Freeship)
          </label>
        </div>
      </div>
    </div>
  );
}
