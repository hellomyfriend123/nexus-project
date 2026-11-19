import type { CommerceOrderSummary } from '../../../services/api/commerce';
import Thumbnail from '../../../shared/components/Thumbnail/Thumbnail';
import { orderStatusLabels } from '../hooks/useBuyerHub';
import { formatVnd } from '../utils/buyerHub.format';

interface Props {
  order: CommerceOrderSummary; busy: boolean; reviewed: boolean;
  onDetail: () => void; onCancel: () => void; onReview: () => void; onRebuy: () => void;
}
export default function BuyerOrderCard({ order, busy, reviewed, onDetail, onCancel, onReview, onRebuy }: Props) {
  return <article className="nx-hub-order-summary">
    <div className="nx-hub-order-summary-main">
      {/* OrderSummaryResponse carries no item data, so the list cannot resolve a real image
          without one catalog request per order. The placeholder keeps the row height stable. */}
      <Thumbnail src={null} alt={`Đơn ${order.orderNumber}`} />
      <div className="nx-hub-order-summary-copy"><strong>{order.orderNumber}</strong><p>{new Date(order.createdAt).toLocaleString('vi-VN')} · {order.orderType === 'AUCTION' ? 'Đấu giá' : 'Mua trực tiếp'}</p></div><span className={'nx-hub-status nx-hub-status-' + order.status.toLowerCase()}>{orderStatusLabels[order.status]}</span></div>
    <div className="nx-hub-order-summary-main"><span>{order.itemCount} sản phẩm</span><strong>{formatVnd(order.totalAmount)}</strong></div>
    <div className="nx-hub-order-summary-actions"><button className="nx-button nx-button-soft" onClick={onDetail}>Xem chi tiết</button>
      {!['COMPLETED', 'CANCELLED'].includes(order.status) && <button className="nx-hub-link" disabled={busy} onClick={onCancel}>Hủy đơn</button>}
      {order.status === 'COMPLETED' && <><button className="nx-hub-link" disabled={busy || reviewed} onClick={onReview}>{reviewed ? 'Đã đánh giá' : 'Đánh giá người bán'}</button><button className="nx-hub-link" disabled={busy} onClick={onRebuy}>Mua lại</button></>}
    </div>
  </article>;
}
