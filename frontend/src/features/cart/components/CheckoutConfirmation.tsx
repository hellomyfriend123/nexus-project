import Modal from 'react-bootstrap/Modal';
import { formatVnd } from '../utils/cart.format';

interface CheckoutConfirmationProps {
  open: boolean;
  itemCount: number;
  total: number;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Confirmation submits a backend COD order, without collecting payment online. */
export default function CheckoutConfirmation({ open, itemCount, total, onCancel, onConfirm }: CheckoutConfirmationProps) {
  return (
    <Modal show={open} onHide={onCancel} centered aria-labelledby="checkout-confirm-title">
      <Modal.Header closeButton closeLabel="Đóng xác nhận đơn hàng">
        <Modal.Title id="checkout-confirm-title" as="h2" className="fs-5">Xác nhận đơn hàng</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>Vui lòng kiểm tra trước khi xác nhận đặt hàng.</p>
        <dl className="d-flex justify-content-between mb-2">
          <dt>Số lượng sản phẩm</dt><dd className="mb-0">{itemCount}</dd>
        </dl>
        <dl className="d-flex justify-content-between mb-3">
          <dt>Tổng tạm tính</dt><dd className="mb-0 fw-bold text-primary">{formatVnd(total)}</dd>
        </dl>
        <p className="alert alert-info small mb-0">Xác nhận sẽ tạo đơn hàng trên máy chủ. Thanh toán khi nhận hàng (COD). Tổng cuối cùng và phí giao hàng được máy chủ xác nhận.</p>
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn btn-light rounded-pill" onClick={onCancel}>Quay lại</button>
        <button type="button" className="btn btn-primary rounded-pill" disabled={itemCount === 0} onClick={onConfirm}>Xác nhận đặt đơn</button>
      </Modal.Footer>
    </Modal>
  );
}
