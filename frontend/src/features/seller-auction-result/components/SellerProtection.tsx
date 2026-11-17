import type { AuctionAction, AuctionResult } from '../types/auctionResult';

interface Props {
  result: AuctionResult;
  onAction: (action: AuctionAction) => void;
}

export default function SellerProtection({ result, onAction }: Props) { return (
  <section className="nx-ar-protection">
    <h2>
      <i className="bi bi-shield-check" aria-hidden="true" /> Bảo vệ Người bán Nexus</h2>
    {result.protection.map(item =>
    <div className="nx-ar-protection-item" key={item.title}>
      <i className={`bi bi-${item.icon}`} aria-hidden="true" />
      <div>
        <h3>{item.title}</h3>
        <p>{item.description}</p>
      </div>
    </div>)}
    <button title="Chưa có API hỗ trợ thao tác này" disabled onClick={() => onAction('protection')}>Xem chính sách bảo vệ người bán</button>
  </section>
  ); }
