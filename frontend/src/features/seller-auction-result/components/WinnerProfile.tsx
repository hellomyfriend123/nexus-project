import type { AuctionAction, AuctionResult } from '../types/auctionResult';

interface Props {
  result: AuctionResult;
  onAction: (action: AuctionAction) => void;
}

export default function WinnerProfile({ result, onAction }: Props) {
  const { winner } = result;
  return (
    <section className="nx-ar-card">
      <div className="nx-ar-card-heading">
        <h2>
          <i className="bi bi-trophy" aria-hidden="true" /> Người thắng đấu giá</h2>
        <span className="nx-ar-tag">{winner.verification}</span>
      </div>
      <div className="nx-ar-winner">
        <span className="nx-ar-avatar">{winner.initials}</span>
        <div className="nx-ar-winner-details">
          <h3>{winner.name}
            <span className="nx-ar-gold-tag">{winner.badge}</span>
          </h3>
          <p>@{winner.username}</p>
          <span className="nx-ar-rating">
            <i className="bi bi-star-fill" aria-hidden="true" /> {winner.rating}
            <span>({winner.reviews ?? 'Chưa có dữ liệu'} đánh giá)</span>
          </span>
        </div>
        <button title="Chưa có API hỗ trợ thao tác này" disabled className="nx-ar-btn nx-ar-btn-soft" onClick={() => onAction('message')}>
          <i className="bi bi-chat-dots" aria-hidden="true" /> Mở khung chat trực tiếp</button>
      </div>
      <div className="nx-ar-address">
        <i className="bi bi-geo-alt" aria-hidden="true" />
        <div>
          <h3>Địa chỉ giao hàng</h3>
          <p>
            <strong>{winner.name}</strong>
            <span className="nx-ar-address-divider">|</span>{winner.phone}</p>
          <p>{result.address}</p>
        </div>
      </div>
      <p className="nx-ar-privacy">
        <i className="bi bi-lock" aria-hidden="true" /> {result.privacyNotice}</p>
      <button title="Chưa có API hỗ trợ thao tác này" disabled className="nx-ar-reminder" onClick={() => onAction('message')}>Gửi lời nhắc thanh toán (Bên mua)</button>
    </section>
  );
}
