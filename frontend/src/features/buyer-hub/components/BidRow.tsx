import type { BuyerBid } from '../types/buyerHub';
import { formatCountdown, formatVnd } from '../utils/buyerHub.format';
import { resolveBidStatusLabel } from '../hooks/useBuyerHub';

interface BidRowProps {
  bid: BuyerBid;
  onAction: (bid: BuyerBid) => void;
  onIconAction: (label: string) => void;
}

export default function BidRow({ bid, onAction, onIconAction }: BidRowProps) {
  const isLost = bid.status === 'lost';
  const isOutbid = bid.status === 'outbid';
  const isLeading = bid.status === 'leading';

  return (
    <article
      className={`nx-hub-bid${isLost ? ' nx-hub-bid--lost' : ''}`}
      aria-label={`${bid.code} — ${bid.title}`}
    >
      <div className="nx-hub-bid-main">
        <div className={`nx-hub-bid-thumb${isLost ? ' nx-hub-bid-thumb--muted' : ''}`}>
          <i className={`bi ${bid.thumbIcon}`} aria-hidden="true"></i>
        </div>

        <div className="nx-hub-bid-body">
          <div className="nx-hub-bid-badges">
            <span
              className={`nx-hub-badge nx-hub-badge--${
                isOutbid ? 'outbid' : isLeading ? 'leading' : 'ended'
              }`}
            >
              {isOutbid && <span className="nx-hub-dot nx-hub-dot--ping" aria-hidden="true"></span>}
              {isLeading && <i className="bi bi-check-circle-fill" aria-hidden="true"></i>}
              {resolveBidStatusLabel(bid.status)}
            </span>
            <span className="nx-hub-bid-code">{bid.code}</span>
          </div>

          <h3
            className={`nx-hub-bid-title${isLost ? ' nx-hub-bid-title--ended' : ''}`}
            title={bid.title}
          >
            {bid.title}
          </h3>

          {isLost ? (
            <p className="nx-hub-bid-meta">
              Giá chốt chung cuộc:{' '}
              <strong className="nx-hub-bid-meta-strong">
                {formatVnd(bid.finalPrice ?? 0)}
              </strong>{' '}
              (Giá bạn: {formatVnd(bid.myBid)})
            </p>
          ) : (
            <div className="nx-hub-bid-meta-row">
              <span>
                Bạn đặt:{' '}
                <strong
                  className={`nx-hub-bid-meta-strong${
                    isLeading ? ' nx-hub-bid-meta-strong--primary' : ''
                  }`}
                >
                  {formatVnd(bid.myBid)}
                </strong>
              </span>

              {isLeading ? (
                <span>
                  Tổng lượt bids:{' '}
                  <strong className="nx-hub-bid-meta-strong">{bid.bidCount ?? 0} lượt</strong>
                </span>
              ) : (
                <span>
                  {bid.topBidder ? 'Cao nhất hiện tại: ' : 'Cao nhất: '}
                  <strong className="nx-hub-bid-meta-strong nx-hub-bid-meta-strong--danger">
                    {formatVnd(bid.topBid ?? 0)}
                  </strong>
                  {bid.topBidder && ` (bởi ${bid.topBidder})`}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="nx-hub-bid-side">
        {isLost ? (
          <span className="nx-hub-bid-ended-label">{bid.endedLabel}</span>
        ) : (
          <div className="nx-hub-bid-timer">
            <span className="nx-hub-bid-timer-label">Còn lại</span>
            <p
              className={`nx-hub-bid-timer-value${
                isOutbid ? ' nx-hub-bid-timer-value--danger' : ''
              }`}
            >
              {formatCountdown(bid.countdownSeconds)}
            </p>
          </div>
        )}

        <div className="nx-hub-bid-actions">
          <button
            type="button"
            className={`nx-hub-bid-btn nx-hub-bid-btn--${
              isOutbid ? 'danger' : isLeading ? 'plain' : 'muted'
            }`}
            onClick={() => onAction(bid)}
          >
            {bid.actionLabel}
          </button>

          {bid.iconAction && (
            <button
              type="button"
              className="nx-hub-bid-icon-btn"
              title={bid.iconAction.label}
              aria-label={bid.iconAction.label}
              onClick={() => onIconAction(bid.iconAction?.label ?? '')}
            >
              <i className={`bi ${bid.iconAction.icon}`} aria-hidden="true"></i>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
