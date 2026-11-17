import type { JourneyStep } from '../types/auctionResult';
export default function FulfillmentJourney({ steps }: { steps: JourneyStep[] }) {
  return <section className="ar-panel ar-journey"><h2><i className="bi bi-signpost-split ar-gold" /> Lộ Trình Xử Lý Sau Đấu Giá</h2><p>Trạng thái chốt phiên và đơn hàng được liên kết</p><ol>{steps.map(step => <li key={step.title} className={`ar-step-${step.state}`}><i className={`bi bi-${step.state === 'done' ? 'check-circle-fill' : step.state === 'active' ? 'credit-card' : 'circle'}`} /><div><b>{step.title}</b><small>{step.description}</small></div></li>)}</ol></section>;
}
