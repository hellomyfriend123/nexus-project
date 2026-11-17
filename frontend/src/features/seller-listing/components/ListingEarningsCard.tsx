import type { CreateListingState } from '../hooks/useCreateListing';

// Aside 3 — Biểu phí minh bạch & số tiền thực nhận.
export default function ListingEarningsCard({ hub }: { hub: CreateListingState }) {
  return (
    <section className="nx-listing-card nx-listing-aside-card">
      <header className="nx-listing-aside-head">
        <h3>Dự tính thực nhận</h3>
        <i className="bi bi-wallet2 nx-listing-aside-icon" aria-hidden="true" />
      </header>
      <p className="nx-listing-aside-desc">Ước tính minh họa, không phải báo giá hoặc số dư từ hệ thống:</p>

      <div className="nx-listing-fees">
        <div className="nx-listing-fee">
          <span>Giá bán dự kiến:</span>
          <strong>{hub.formatted.dealPrice}</strong>
        </div>
        <div className="nx-listing-fee is-muted">
          <span>
            Phí dịch vụ sàn Nexus (3%):
            <i className="bi bi-question-circle" title="Phí duy trì nền tảng và thanh toán trực tuyến" aria-hidden="true" />
          </span>
          <em>-{hub.formatted.serviceFee}</em>
        </div>
        <div className="nx-listing-fee is-muted">
          <span>Bảo hiểm rủi ro Nexus Escrow:</span>
          <em className="is-primary">Chưa có dữ liệu</em>
        </div>
        <div className="nx-listing-fee is-muted">
          <span>Phí đóng gói &amp; seal an toàn:</span>
          <em className="is-primary">Chưa có dữ liệu</em>
        </div>
        <div className="nx-listing-net">
          <p>
            <span>Ước tính (chưa xác nhận phí):</span>
            <strong>{hub.formatted.netEarnings}</strong>
          </p>
          <p className="nx-listing-net-note">
            <i className="bi bi-lightning-charge-fill" aria-hidden="true" />
            Tự động giải ngân sau 24h khi người mua ấn xác nhận nhận hàng.
          </p>
        </div>
      </div>
    </section>
  );
}
