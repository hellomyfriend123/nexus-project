import type { BuyerProfile } from '../types/buyerHub';
import { formatReviewCount, formatVnd } from '../utils/buyerHub.format';

interface BuyerProfileCardProps {
  profile: BuyerProfile;
  onCreateAuction: () => void;
}

export default function BuyerProfileCard({ profile, onCreateAuction }: BuyerProfileCardProps) {
  return (
    <section className="nx-hub-profile" aria-labelledby="hub-profile-name">
      <div className="nx-hub-profile-identity">
        <div className="nx-hub-avatar">
          <span className="nx-hub-avatar-letter" aria-hidden="true">
            {profile.initial}
          </span>
          {profile.verified && (
            <span className="nx-hub-avatar-verified" title="Nexus Gold Verified">
              <i className="bi bi-patch-check-fill" aria-hidden="true"></i>
              <span className="nx-hub-sr-only">Đã xác thực Nexus Gold</span>
            </span>
          )}
        </div>

        <div className="nx-hub-profile-text">
          <div className="nx-hub-profile-badges">
            <h1 id="hub-profile-name" className="nx-hub-profile-name">
              {profile.name}
            </h1>
            <span className="nx-hub-pill nx-hub-pill--tier">
              <i className="bi bi-award-fill" aria-hidden="true"></i>
              {profile.memberTier}
            </span>
            <span className="nx-hub-pill nx-hub-pill--id">ID: {profile.memberId}</span>
          </div>

          <div className="nx-hub-profile-meta">
            <span className="nx-hub-profile-rating">
              <i className="bi bi-star-fill" aria-hidden="true"></i>
              <strong>{profile.rating}</strong>
              <span className="nx-hub-muted">{profile.reviewCount === null ? "Chưa có dữ liệu" : formatReviewCount(profile.reviewCount)}</span>
            </span>
            <span className="nx-hub-profile-sep" aria-hidden="true">
              •
            </span>
            <span className="nx-hub-profile-rate">
              Tỷ lệ thanh toán thắng thầu: <strong>{profile.winPaymentRate}</strong>
            </span>
            <span className="nx-hub-profile-sep" aria-hidden="true">
              •
            </span>
            <span className="nx-hub-muted">Tham gia từ: {profile.joinedAt}</span>
          </div>
        </div>
      </div>

      <div className="nx-hub-profile-actions">
        <div className="nx-hub-wallet">
          <div className="nx-hub-wallet-cell">
            <p className="nx-hub-wallet-label">Số dư Ví Nexus</p>
            <p className="nx-hub-wallet-value">{profile.walletBalance === null ? "Chưa hỗ trợ" : formatVnd(profile.walletBalance)}</p>
          </div>
          <span className="nx-hub-wallet-divider" aria-hidden="true"></span>
          <div className="nx-hub-wallet-cell">
            <p className="nx-hub-wallet-label">Voucher khả dụng</p>
            <p className="nx-hub-wallet-voucher">{profile.voucherCount === null ? "Chưa hỗ trợ" : `${profile.voucherCount} mã giảm giá`}</p>
          </div>
        </div>

        <button type="button" className="nx-hub-cta" onClick={onCreateAuction}>
          <i className="bi bi-hammer" aria-hidden="true"></i>
          <span>+ Đăng bán / Tạo phiên đấu giá cá nhân</span>
        </button>
      </div>
    </section>
  );
}
