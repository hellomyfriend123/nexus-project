import ListingDescriptionEditor from './ListingDescriptionEditor';
import { listingConditions } from '../constants/createListing.constants';
import type { CreateListingState } from '../hooks/useCreateListing';

// Bước 3 — Tình trạng thực tế, thông số, phụ kiện và mô tả.
export default function ListingCondition({ hub }: { hub: CreateListingState }) {
  const { draft } = hub;
  return (
    <div className="nx-listing-stack">
      <div>
        <p className="nx-listing-label">
          Tình trạng sản phẩm <em>*</em>
        </p>
        <div className="nx-listing-conditions">
          {listingConditions.map(option => {
            const active = hub.condition === option.id;
            return (
              <button
                key={option.id}
                type="button"
                className={`nx-listing-condition${active ? ' is-active' : ''}`}
                aria-pressed={active}
                onClick={() => hub.setCondition(option.id)}
              >
                <span className="nx-listing-condition-title">
                  {option.title}
                  {active && <i className="bi bi-check-circle-fill" aria-hidden="true" />}
                </span>
                <span className="nx-listing-condition-caption">{option.caption}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="nx-listing-three-col">
        <div>
          <label htmlFor="listing-shutter" className="nx-listing-label">Số shot đã chụp (Shutter count)</label>
          <input
            id="listing-shutter"
            type="text"
            className="nx-listing-input"
            value={draft.shutter}
            placeholder="VD: 5.000 shots"
            onChange={event => hub.updateDraft('shutter', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="listing-warranty" className="nx-listing-label">Thời hạn bảo hành</label>
          <input
            id="listing-warranty"
            type="text"
            className="nx-listing-input"
            value={draft.warranty}
            placeholder="VD: Còn 12 tháng"
            onChange={event => hub.updateDraft('warranty', event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="listing-origin" className="nx-listing-label">Xuất xứ / Mã vùng</label>
          <input
            id="listing-origin"
            type="text"
            className="nx-listing-input"
            value={draft.origin}
            placeholder="VD: Chính hãng VN / Nhật Bản"
            onChange={event => hub.updateDraft('origin', event.target.value)}
          />
        </div>
      </div>

      <div>
        <p className="nx-listing-label">Phụ kiện đi kèm thực tế</p>
        <div className="nx-listing-chips">
          {hub.accessories.map(item => (
            <span key={item} className="nx-listing-chip nx-listing-chip--removable">
              {item}
              <button
                type="button"
                title="Bỏ phụ kiện"
                onClick={() => hub.removeAccessory(item)}
              >
                <i className="bi bi-x-lg" aria-hidden="true" />
              </button>
            </span>
          ))}
          <button type="button" className="nx-listing-chip nx-listing-chip--add" onClick={() => hub.mockAction('Thêm phụ kiện')}>
            <i className="bi bi-plus-lg" aria-hidden="true" />
            Thêm phụ kiện
          </button>
        </div>
      </div>

      <div>
        <div className="nx-listing-label-row">
          <label htmlFor="listing-description" className="nx-listing-label">Mô tả chi tiết sản phẩm</label>
          <span className="nx-listing-optional">Tối thiểu 100 từ</span>
        </div>
        <ListingDescriptionEditor
          id="listing-description"
          value={draft.description}
          placeholder="Cung cấp thông tin lịch sử sử dụng, bảo quản trong tủ chống ẩm, lý do bán (lên đời máy), tình trạng cảm biến không tì vết..."
          onChange={html => hub.updateDraft('description', html)}
        />
      </div>
    </div>
  );
}
