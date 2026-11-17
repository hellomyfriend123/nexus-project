import type { CreateListingState } from '../hooks/useCreateListing';

// Khối tiêu đề trang + 3 hành động chính (đều là mock).
export default function ListingHeader({ hub }: { hub: CreateListingState }) {
  return (
    <header className="nx-listing-header">
      <div className="nx-listing-header-copy">
        <div className="nx-listing-header-meta">
          <span className="nx-listing-badge">SELLER HUB PRO</span>
          <span className="nx-listing-saved">
            <i aria-hidden="true" />
            {hub.saved ? 'Bản nháp đã lưu trên thiết bị' : 'Lưu bản nháp để giữ thay đổi'}
          </span>
        </div>
        <h1>Đăng Bán Sản Phẩm Mới (Thêm vào Kho &amp; Niêm Yết)</h1>
        <p>
          Cung cấp đầy đủ hình ảnh, thông số kỹ thuật, tình trạng và định giá để mở bán ngay
          hoặc thiết lập phiên đấu giá sau này.
        </p>
      </div>
      <div className="nx-listing-header-actions">
        <button type="button" className="nx-listing-btn" onClick={hub.saveDraft}>
          <i className="bi bi-save" aria-hidden="true" />
          Lưu bản nháp
        </button>
        <button type="button" className="nx-listing-btn" onClick={() => hub.mockAction('Xem trước niêm yết')}>
          <i className="bi bi-eye" aria-hidden="true" />
          Xem trước niêm yết
        </button>
        <button type="button" className="nx-listing-btn nx-listing-btn--primary" disabled={hub.submitting} onClick={hub.submitListing}>
          <i className="bi bi-rocket-takeoff" aria-hidden="true" />
          Đăng bán ngay
        </button>
      </div>
    </header>
  );
}
