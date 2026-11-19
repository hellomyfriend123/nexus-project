import type { CreateListingState } from '../hooks/useCreateListing';

// Aside 3 — Biểu phí minh bạch & số tiền thực nhận.
export default function ListingEarningsCard({ hub }: { hub: CreateListingState }) {
  return (
    <section className="nx-listing-card nx-listing-aside-card">
      <header className="nx-listing-aside-head">
        <h3>Dự tính thực nhận</h3>
        <i className="bi bi-wallet2 nx-listing-aside-icon" aria-hidden="true" />
      </header>
      <p className="nx-listing-aside-desc">Tính phí và dự tính thực nhận chưa được hỗ trợ.</p>

      <div className="nx-listing-fees">
        <div className="nx-listing-fee">
          <span>Giá bán dự kiến:</span>
          <strong>{hub.formatted.price}</strong>
        </div>
        <div className="nx-listing-fee is-muted">
          <span>
            Phí dịch vụ sàn Nexus:
            <i className="bi bi-question-circle" title="Phí duy trì nền tảng và thanh toán trực tuyến" aria-hidden="true" />
          </span>
          <em>N/A</em>
        </div>
        <div className="nx-listing-fee is-muted">
          <span>Bảo hiểm rủi ro Nexus Escrow:</span>
          <em className="is-primary">N/A</em>
        </div>
        <div className="nx-listing-fee is-muted">
          <span>Phí đóng gói &amp; seal an toàn:</span>
          <em className="is-primary">N/A</em>
        </div>
        <div className="nx-listing-net">
          <p>
            <span>Thực nhận:</span>
            <strong>N/A</strong>
          </p>
          <p className="nx-listing-net-note">
            <i className="bi bi-lightning-charge-fill" aria-hidden="true" />
            Thông tin phí và thời gian giải ngân chưa được hỗ trợ.
          </p>
        </div>
      </div>
    </section>
  );
}
