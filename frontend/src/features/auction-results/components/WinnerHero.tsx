import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { AuctionSummary, Settlement } from '../types/auctionResult';
import { formatMoney } from '../services/auctionResultService';
import VNPaySandboxModal from '../../payment/components/VNPaySandboxModal';
import { notify } from '../../../shared/components/Toast';

const statuses: Record<string, string> = { PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', SHIPPING: 'Đang giao', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy' };
export default function WinnerHero({ summary, settlement }: { summary: AuctionSummary; settlement: Settlement }) {
  const [paying, setPaying] = useState(false);
  const [paidStatus, setPaidStatus] = useState<string | null>(null);
  const currentStatus = paidStatus ?? settlement.orderStatus ?? '';
  return <section className="ar-result-hero ar-result-hero-winner">
    <p className="ar-eyebrow">KẾT QUẢ ĐẤU GIÁ</p><h1>Chúc mừng {summary.buyer}, bạn đã thắng phiên đấu giá!</h1><p>Phiên kết thúc lúc {summary.endedAt}.</p>
    <dl className="ar-result-stats"><div><dt>Giá thắng thầu</dt><dd>{formatMoney(summary.winningBid)}</dd></div><div><dt>Giá khởi điểm</dt><dd>{formatMoney(summary.startingPrice)}</dd></div><div><dt>Lượt giá hợp lệ</dt><dd>{summary.bidCount}</dd></div></dl>
    {settlement.orderId ? (
      <div className="ar-result-next">
        <p>Đơn hàng: {statuses[currentStatus] ?? 'Đã liên kết với phiên đấu giá'}</p>
        <div className="d-flex flex-wrap gap-2">
          {currentStatus === 'PENDING' && (
            <button type="button" className="nx-button nx-button-primary" onClick={() => setPaying(true)}>
              Thanh toán VNPAY ngay
            </button>
          )}
          <Link className="nx-button nx-button-soft" to={'/buyer-hub?orderId=' + encodeURIComponent(settlement.orderId)}>
            Xem đơn hàng
          </Link>
        </div>
      </div>
    ) : <p>Đơn hàng chưa được liên kết với phiên đấu giá.</p>}
    {paying && settlement.orderId && (
      <VNPaySandboxModal
        orderId={settlement.orderId}
        orderNumber={`Đấu giá #${settlement.orderId.slice(0, 8)}`}
        amount={summary.winningBid}
        onSuccess={() => {
          setPaidStatus('CONFIRMED');
          notify.success('Thanh toán VNPAY cho đơn thắng đấu giá thành công!');
        }}
        onClose={() => setPaying(false)}
      />
    )}
  </section>;
}

