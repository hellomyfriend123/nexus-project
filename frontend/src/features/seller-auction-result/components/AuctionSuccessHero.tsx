import AuctionMetrics from './AuctionMetrics';
import type { AuctionAction, AuctionResult } from '../types/auctionResult';

interface Props {
  result: AuctionResult;
  onAction: (action: AuctionAction) => void;
}

export default function AuctionSuccessHero({ result, onAction }: Props) {
  return (
    <section className="nx-ar-hero" aria-labelledby="auction-result-title">
      <div className="nx-ar-hero-main">
  
        <div>
          <div className="nx-ar-hero-meta">
            <span>KẾT QUẢ ĐẤU GIÁ</span>
            <span>{result.id}</span>
            <span>•</span>
            <span>{result.endedAt}</span>
          </div>
          <h1 id="auction-result-title">{result.title} {result.subtitle}</h1>
          <p>Người thắng giá: <strong>{result.winner.name}</strong> ({result.winner.username}) · {result.bidCount} lượt trả giá.</p>
          <div className="nx-ar-payment">
            <i className="bi bi-shield-check" aria-hidden="true" /> {result.paymentStatus}
          </div>
        </div>
      </div>
      <div className="nx-ar-hero-actions">
        <button title="Chưa có API hỗ trợ thao tác này" disabled className="nx-ar-btn nx-ar-btn-white" onClick={() => onAction('message')}>
          <i className="bi bi-chat-dots" aria-hidden="true" /> Nhắn tin cho Người thắng</button>
        <button title="Chưa có API hỗ trợ thao tác này" disabled className="nx-ar-btn nx-ar-btn-receipt" onClick={() => onAction('receipt')}>
          <i className="bi bi-printer" aria-hidden="true" /> In biên bản chốt thầu (PDF)</button>
        <button title="Chưa có API hỗ trợ thao tác này" disabled className="nx-ar-btn nx-ar-btn-pack" onClick={() => onAction('shipping')}><i className="bi bi-box-seam" aria-hidden="true" /> Chuẩn bị hàng đóng gói</button>
      </div>
      <AuctionMetrics metrics={result.metrics} />
    </section>
  );
}
