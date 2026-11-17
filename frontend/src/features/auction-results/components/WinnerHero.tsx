import type { AuctionSummary, Settlement } from '../types/auctionResult';
import { formatMoney } from '../services/auctionResultService';
import PaymentCountdown from './PaymentCountdown';
interface Props { summary: AuctionSummary; settlement: Settlement; seconds: number; onAction: (label: string) => void }
export default function WinnerHero({ summary, settlement, seconds, onAction }: Props) {
  return <section className="ar-winner-hero"><div className="ar-winner-main"><p className="ar-eyebrow"><i className="bi bi-award" /> NEXUS · PHIÊN ĐẤU GIÁ #{summary.auctionId}</p><h1>CHÚC MỪNG {summary.buyer.toUpperCase()}!<br />BẠN LÀ NGƯỜI CHIẾN THẮNG PHIÊN ĐẤU GIÁ</h1><p>Kết quả chốt phiên được máy chủ xác nhận lúc {summary.endedAt}.</p><div className="ar-winner-stats"><div><small>Giá thắng thầu chung cuộc</small><strong>{formatMoney(summary.winningBid)}</strong></div><div><small>Giá niêm yết sản phẩm</small><b>{formatMoney(summary.marketPrice)}</b></div><div><small>Mức giá ban đầu</small><b>{formatMoney(summary.startingPrice)}</b></div></div></div><PaymentCountdown seconds={seconds} amount={summary.winningBid} methods={settlement.paymentMethods} onAction={onAction} /><div className="ar-hero-trust"><span>Đơn hàng: {settlement.orderId ?? 'Chưa có đơn hàng liên kết'}</span><span>Trạng thái: {settlement.orderStatus ?? 'Chưa có dữ liệu đơn hàng'}</span></div></section>;
}
