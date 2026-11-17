import { listingBrands } from '../constants/createListing.constants';
import type { CreateListingState } from '../hooks/useCreateListing';

// Bước 1 — Thông tin cơ bản & phân loại ngành hàng.
export default function ListingBasicInfo({ hub }: { hub: CreateListingState }) {
  const { draft } = hub;
  return (
    <div className="nx-listing-stack">
      <div>
        <div className="nx-listing-label-row">
          <label htmlFor="listing-title" className="nx-listing-label">
            Tên sản phẩm niêm yết <em>*</em>
          </label>
          <button type="button" className="nx-listing-link" onClick={() => hub.mockAction('Nexus AI gợi ý tên')}>
            <i className="bi bi-stars" aria-hidden="true" />
            Nexus AI gợi ý tên chuẩn SEO
          </button>
        </div>
        <div className="nx-listing-input-wrap">
          <input
            id="listing-title"
            type="text"
            maxLength={hub.titleMax}
            value={draft.title}
            placeholder="VD: Máy ảnh Canon EOS R6 Mark II Fullbox Like New 99% Chính Hãng"
            onChange={event => hub.updateDraft('title', event.target.value)}
          />
          <span className={`nx-listing-counter${hub.titleOverLimit ? ' is-over' : ''}`}>
            {hub.titleLength}/{hub.titleMax}
          </span>
        </div>
        <div className="nx-listing-hint-row">
          <span className="nx-listing-chip nx-listing-chip--seo">SEO: chưa có API chấm điểm</span>
          <span className="nx-listing-hint">
            Bao gồm: Tên máy + Tình trạng + Xuất xứ + Phụ kiện
          </span>
        </div>
      </div>

      <div>
        <p className="nx-listing-label">
          Danh mục ngành hàng <em>*</em>
        </p>
        <div className="nx-listing-category">
<select aria-label="Danh mục ngành hàng" value={hub.category} onChange={event => hub.setCategory(event.target.value)}><option value="">Chọn danh mục</option>{hub.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </div>
      </div>

      <div className="nx-listing-two-col">
        <div>
          <label htmlFor="listing-brand" className="nx-listing-label">
            Thương hiệu (Brand) <em>*</em>
          </label>
          <div className="nx-listing-select">
            <select
              id="listing-brand"
              value={draft.brand}
              onChange={event => hub.updateDraft('brand', event.target.value)}
            >
              {listingBrands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
            <i className="bi bi-caret-down-fill" aria-hidden="true" />
          </div>
          <p className="nx-listing-verified">
            <i className="bi bi-patch-check-fill" aria-hidden="true" />
            Chính hãng có hóa đơn &amp; thẻ bảo hành
          </p>
        </div>
        <div>
          <div className="nx-listing-label-row">
            <label htmlFor="listing-sku" className="nx-listing-label">Mã SKU / Phân loại kho</label>
            <span className="nx-listing-optional">Tùy chọn</span>
          </div>
          <div className="nx-listing-sku">
            <input
              id="listing-sku"
              type="text"
              value={draft.sku}
              placeholder="VD: SKU-10293-PRO"
              onChange={event => hub.updateDraft('sku', event.target.value)}
            />
            <button
              type="button"
              className="nx-listing-icon-btn"
              title="Tạo mã ngẫu nhiên"
              onClick={() => hub.mockAction('Tạo mã SKU')}
            >
              <i className="bi bi-arrow-repeat" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
