import type { AuctionWinNotice } from '../types/buyerHub';
import { formatVnd } from '../utils/buyerHub.format';

interface AuctionWinAlertProps {
  notice: AuctionWinNotice | null;
  onViewDetail: () => void;
  onPay: () => void;
}

export default function AuctionWinAlert({ notice, onViewDetail, onPay }: AuctionWinAlertProps) {
  return (
    <section className="nx-hub-win" aria-labelledby="hub-win-title">
      <div className="nx-hub-win-main">
        <span className="nx-hub-win-icon" aria-hidden="true">
          <i className="bi bi-stars"></i>
        </span>

        <div className="nx-hub-win-text">
          <div className="nx-hub-win-heading">
            <h2 id="hub-win-title" className="nx-hub-win-title">
              {notice ? `Chúc mừng! Bạn đã thắng phiên đấu giá ${notice.code}` : 'Thông tin phiên đấu giá đã thắng'}
            </h2>
            <span className="nx-hub-win-tag">{notice ? "Cần thanh toán" : "Chưa hỗ trợ"}</span>
          </div>
          <p className="nx-hub-win-desc">
            {notice ? <>Sản phẩm: <strong>{notice.productName}</strong> với giá chốt <strong>{formatVnd(notice.finalPrice)}</strong>. Vui lòng thanh toán trong 24h để người bán bàn giao hàng vận chuyển.</> : "Backend chưa cung cấp danh sách phiên thắng và hạn thanh toán cá nhân. Không có thông tin thanh toán nào được suy đoán."}
          </p>
        </div>
      </div>

      <div className="nx-hub-win-actions">
        <button type="button" className="nx-hub-btn nx-hub-btn--white" onClick={onViewDetail} disabled={!notice}>
          Chi tiết phiên
        </button>
        <button type="button" className="nx-hub-btn nx-hub-btn--pay" onClick={onPay} disabled={!notice}>
          {notice?.payLabel ?? "Thanh toán chưa khả dụng"}
        </button>
      </div>
    </section>
  );
}
