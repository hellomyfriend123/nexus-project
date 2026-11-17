import type { C2cAuction } from '../types/buyerHub';
import { formatVnd } from '../utils/buyerHub.format';

interface C2cAuctionCardProps {
  auction: C2cAuction;
  /** "Đang mở thầu sôi động" — copy owned by the mock layer. */
  activeLabel: string;
  onViewBidders: (bidCount: number) => void;
  onEndEarly: () => void;
}

/** Active personal (C2C) auction status block inside the C2C tab. */
export default function C2cAuctionCard({
  auction,
  activeLabel,
  onViewBidders,
  onEndEarly,
}: C2cAuctionCardProps) {
  return (
    <div className="nx-hub-c2c-card">
      <div className="nx-hub-c2c-card-head">
        <div className="nx-hub-c2c-badge-row">
          <span className="nx-hub-c2c-status">
            <span className="nx-hub-c2c-dot" aria-hidden="true"></span>
            {activeLabel}
          </span>
          <span className="nx-hub-c2c-code">{auction.code}</span>
        </div>
        <span className="nx-hub-c2c-timer">{auction.remainingLabel}</span>
      </div>

      <div className="nx-hub-c2c-body">
        <div className="nx-hub-c2c-product">
          <div className="nx-hub-c2c-thumb">
            <i className={`bi ${auction.thumbIcon}`} aria-hidden="true"></i>
          </div>
          <div className="nx-hub-c2c-info">
            <h4 className="nx-hub-c2c-name">{auction.title}</h4>
            <p className="nx-hub-c2c-meta">
              Giá khởi điểm: {formatVnd(auction.startPrice)} • Bước giá:{' '}
              {formatVnd(auction.stepPrice)}
            </p>
            <p className="nx-hub-c2c-top">
              Đấu giá cao nhất: {formatVnd(auction.topBid)}
              <span className="nx-hub-c2c-top-note">({auction.bidCount} lượt đấu giá)</span>
            </p>
          </div>
        </div>

        <div className="nx-hub-c2c-actions">
          <button
            type="button"
            className="nx-hub-btn nx-hub-btn--primary"
            onClick={() => onViewBidders(auction.bidCount)}
          >
            Xem {auction.bidCount} người đặt giá
          </button>
          <button type="button" className="nx-hub-btn nx-hub-btn--ghost" onClick={onEndEarly}>
            Kết thúc sớm
          </button>
        </div>
      </div>
    </div>
  );
}
