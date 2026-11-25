import type { CreateListingState } from '../hooks/useCreateListing';

// Thanh hành động cuối trang.
export default function ListingActionBar({ hub }: { hub: CreateListingState }) {
  return (
    <div className="nx-listing-actionbar">
      <p>
        <i className="bi bi-lock" aria-hidden="true" />
        Giao dịch được bảo vệ theo điều khoản bảo mật Nexus Seller Protection.
      </p>
      <div className="nx-listing-actionbar-actions">
        <button type="button" onClick={hub.saveDraft}>Lưu Nháp</button>
        <button type="button" className="is-primary" disabled={hub.submitting} onClick={hub.submitListing}>
          Đăng Bán Sản Phẩm
        </button>
      </div>
    </div>
  );
}
