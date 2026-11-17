import type { CreateListingState } from '../hooks/useCreateListing';

// Aside 4 — Gợi ý chuyển nhanh sang phiên đấu giá.
export default function ListingAuctionCard({ hub }: { hub: CreateListingState }) {
  return (
    <section className="nx-listing-auction">
      <div className="nx-listing-auction-icon">
        <i className="bi bi-hammer" aria-hidden="true" />
      </div>
      <div className="nx-listing-auction-body">
        <h4>Bạn muốn chốt giá cao nhất?</h4>
        <p>
          Máy ảnh Fullbox đang có nhu cầu tìm mua rất lớn! Mở phiên đấu giá 48h để các tay máy
          cạnh tranh giá tốt nhất.
        </p>
        <button type="button" onClick={() => hub.mockAction('Tạo Đấu Giá Sản Phẩm Này')}>
          Tạo Đấu Giá Sản Phẩm Này
          <i className="bi bi-arrow-right" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
