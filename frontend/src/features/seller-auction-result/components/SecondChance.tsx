import type { AuctionAction, ProtectionMessage } from '../types/auctionResult';

interface Props {
  message: ProtectionMessage;
  onAction: (action: AuctionAction) => void;
}

export default function SecondChance({ message, onAction }: Props) {
  return (
    <section className="nx-ar-card nx-ar-second-chance">
      <div className="nx-ar-card-heading">
        <h2>
          <i className={'bi bi-'+message.icon} aria-hidden="true" />{message.title}</h2>
      </div>
      <p>{message.description}</p>
      <button title="Chưa có API hỗ trợ thao tác này" disabled className="nx-ar-view-bids" onClick={() => onAction('protection')}>Xem điều kiện kích hoạt Second Chance
        <i className="bi bi-arrow-up-right" aria-hidden="true" />
      </button>
    </section>
  );
}
