import { Link } from 'react-router-dom';
import type { AuctionSummary, Settlement } from '../types/auctionResult';
import { formatMoney } from '../services/auctionResultService';
const statuses: Record<string, string> = { PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', SHIPPING: 'Đang giao', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy' };
export default function WinnerHero({ summary, settlement }: { summary: AuctionSummary; settlement: Settlement }) {
  return <section className="ar-result-hero ar-result-hero-winner">
    <p className="ar-eyebrow">KẾT QUẢ ĐẤU GIÁ</p><h1>Chúc mừng {summary.buyer}, bạn đã thắng phiên đấu giá!</h1><p>Phiên kết thúc lúc {summary.endedAt}.</p>
    <dl className="ar-result-stats"><div><dt>Giá thắng thầu</dt><dd>{formatMoney(summary.winningBid)}</dd></div><div><dt>Giá khởi điểm</dt><dd>{formatMoney(summary.startingPrice)}</dd></div><div><dt>Lượt giá hợp lệ</dt><dd>{summary.bidCount}</dd></div></dl>
    {settlement.orderId ? <div className="ar-result-next"><p>Đơn hàng: {statuses[settlement.orderStatus ?? ''] ?? 'Đã liên kết với phiên đấu giá'}</p><Link className="nx-button nx-button-primary" to={'/buyer-hub?orderId=' + encodeURIComponent(settlement.orderId)}>Xem đơn hàng</Link></div> : <p>Đơn hàng chưa được liên kết với phiên đấu giá.</p>}
  </section>;
}

