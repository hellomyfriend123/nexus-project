import type { AuctionAction, AuctionResult } from '../types/auctionResult';

interface Props {
  result: AuctionResult;
  onAction: (action: AuctionAction) => void;
}

export default function BidAuditLog({ result, onAction }: Props) { return (
  <section className="nx-ar-card">
    <div className="nx-ar-card-heading">
      <h2>
        <i className="bi bi-graph-up-arrow" aria-hidden="true" /> Nhật ký trả giá</h2>
      <span className="nx-ar-tag">{result.bidCount} lượt trả giá</span>
    </div>
    <div className="nx-ar-bid-summary">
      <span>GIÁ CHỐT CUỐI CÙNG</span>
      <strong>{result.winningBid}</strong>
      <small>{result.subtitle}</small>
    </div>
    <ol className="nx-ar-bids">
      {result.bids.map((bid) =>
      <li className={bid.winner ? 'is-winner' : ''} key={bid.id}>
        <span className="nx-ar-bid-avatar">{bid.initials}</span>
        <div className="nx-ar-bid-person">
          <strong>{bid.name} {bid.winner &&
            <i className="bi bi-trophy-fill" aria-label="Người thắng" />}</strong>
          <span>{bid.time} </span>
        </div>
        <strong className="nx-ar-bid-amount">{bid.amount}</strong>
      </li>)}
    </ol>
    <button className="nx-ar-view-bids" onClick={() => onAction('bids')}>Xem lịch sử đấu giá
      <i className="bi bi-arrow-right" aria-hidden="true" />
    </button>
  </section>
  ); }
