import { Link } from 'react-router-dom';

interface CartEmptyStateProps {
  /** Optional explanation shown under the heading. */
  message?: string;
}

export default function CartEmptyState({
  message = 'Các sản phẩm bạn chọn mua hoặc trúng thầu sẽ xuất hiện tại đây.',
}: CartEmptyStateProps) {
  return (
    <div className="nx-cart-empty">
      <span className="nx-cart-empty-icon" aria-hidden="true">
        <i className="bi bi-cart-x"></i>
      </span>
      <h2 className="nx-cart-empty-title">Giỏ hàng của bạn đang trống</h2>
      <p className="nx-cart-empty-text">{message}</p>
      <Link to="/products" className="nx-cart-empty-action">
        <i className="bi bi-grid" aria-hidden="true"></i>
        <span>Tiếp tục mua sắm</span>
      </Link>
    </div>
  );
}
