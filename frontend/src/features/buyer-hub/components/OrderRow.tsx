import type { BuyerOrder } from '../types/buyerHub';
import { formatVnd } from '../utils/buyerHub.format';

interface OrderRowProps {
  order: BuyerOrder;
  onTrack: (code: string) => void;
  onCancel: (code: string) => void;
  onReview: (code: string) => void;
  onRebuy: (code: string) => void;
}

export default function OrderRow({ order, onTrack, onCancel, onReview, onRebuy }: OrderRowProps) {
  const isShipping = ['pending', 'confirmed', 'shipping'].includes(order.state);

  return (
    <article className="nx-hub-order">
      <header className="nx-hub-order-head">
        <div className="nx-hub-order-head-left">
          <span className="nx-hub-order-code">{order.code}</span>
          <span className={`nx-hub-order-tag nx-hub-order-tag--${order.tag.tone}`}>
            {order.tag.text}
          </span>
          <span className="nx-hub-order-placed">{order.placedNote}</span>
        </div>
        <span
          className={`nx-hub-order-status nx-hub-order-status--${order.status.tone}`}
        >
          <i className={`bi ${order.status.icon}`} aria-hidden="true"></i>
          {order.status.text}
        </span>
      </header>

      <div className="nx-hub-order-body">
        <div className="nx-hub-order-main">
          <div className={`nx-hub-order-thumb nx-hub-order-thumb--${order.thumbTone}`}>
            <i className={`bi ${order.thumbIcon}`} aria-hidden="true"></i>
          </div>
          <div className="nx-hub-order-info">
            <h4 className="nx-hub-order-title">{order.title}</h4>
            <p className="nx-hub-order-meta">{order.meta}</p>
            <p className="nx-hub-order-price">{formatVnd(order.price)}</p>
          </div>
        </div>

        <div className="nx-hub-order-actions">
          {isShipping ? (
            <>
              <button
                type="button"
                className="nx-hub-order-btn nx-hub-order-btn--primary"
                onClick={() => onTrack(order.code)}
              >
                Tra cứu vận đơn
              </button>
              <button
                type="button"
                className="nx-hub-order-btn nx-hub-order-btn--plain"
                onClick={() => onCancel(order.code)}
              >
                Hủy đơn hàng
              </button>
            </>
          ) : order.state === 'completed' ? (
            <>
              <button
                type="button"
                className="nx-hub-order-btn nx-hub-order-btn--white"
                onClick={() => onReview(order.code)}
              >
                <i className="bi bi-star-fill" aria-hidden="true"></i>
                Đánh giá 5 sao
              </button>
              <button
                type="button"
                className="nx-hub-order-btn nx-hub-order-btn--plain"
                onClick={() => onRebuy(order.code)}
              >
                Mua lại
              </button>
            </>
          ) : null}
        </div>
      </div>
    </article>
  );
}
