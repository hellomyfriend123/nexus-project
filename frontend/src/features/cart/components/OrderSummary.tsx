import type { FormEvent } from 'react';
import type { CartTotals, Voucher } from '../types/cart';
import { formatVnd } from '../utils/cart.format';

interface OrderSummaryProps {
  totals: CartTotals;
  voucher: Voucher | null;
  voucherInput: string;
  shippingLabel: string;
  hasItems: boolean;
  onVoucherInput: (value: string) => void;
  onApplyVoucher: () => void;
  onClearVoucher: () => void;
  onCheckout: () => void;
  onSupport: () => void;
}

export default function OrderSummary({
  totals,
  voucher,
  voucherInput,
  shippingLabel,
  hasItems,
  onVoucherInput,
  onApplyVoucher,
  onClearVoucher,
  onCheckout,
  onSupport,
}: OrderSummaryProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApplyVoucher();
  };

  return (
    <div className="nx-cart-summary">
      <div className="nx-cart-summary-card">
        <h3 className="nx-cart-summary-title">Tóm tắt đơn hàng</h3>

        {/* Voucher (FR-20) */}
        <div className="nx-cart-voucher">
          <label className="nx-cart-voucher-label" htmlFor="nx-cart-voucher">
            Mã giảm giá Nexus (Voucher)
          </label>

          <form className="nx-cart-voucher-form" onSubmit={handleSubmit}>
            <div className="nx-cart-voucher-field">
              <i className="bi bi-ticket-perforated" aria-hidden="true"></i>
              <input
                id="nx-cart-voucher"
                type="text"
                className="nx-cart-voucher-input"
                placeholder="Nhập mã ưu đãi..."
                value={voucherInput}
                onChange={(event) => onVoucherInput(event.target.value)}
              />
            </div>
            <button type="submit" className="nx-cart-voucher-apply">
              Áp dụng
            </button>
          </form>

          {voucher && (
            <div className="nx-cart-voucher-applied">
              <span className="nx-cart-voucher-applied-text">
                <i className="bi bi-check-circle-fill" aria-hidden="true"></i>
                <span>
                  Mã {voucher.code}: Đã giảm {formatVnd(totals.discount)}
                </span>
              </span>
              <button
                type="button"
                className="nx-cart-voucher-clear"
                onClick={onClearVoucher}
                aria-label="Bỏ mã giảm giá"
              >
                <i className="bi bi-x-lg" aria-hidden="true"></i>
              </button>
            </div>
          )}

          <p className="nx-cart-voucher-note">
            <i className="bi bi-info-circle" aria-hidden="true"></i>
            <span>
              Lưu ý hệ thống: Mã giảm giá chỉ áp dụng cho sản phẩm Mua trực tiếp
              (Không áp dụng cho hàng trúng thầu Đấu giá).
            </span>
          </p>
        </div>

        {/* Breakdown */}
        <div className="nx-cart-breakdown">
          <div className="nx-cart-breakdown-row">
            <span>Tạm tính hàng mua ngay ({totals.directCount} SP):</span>
            <span className="nx-cart-breakdown-value">
              {formatVnd(totals.directSubtotal)}
            </span>
          </div>

          <div className="nx-cart-breakdown-row">
            <span className="nx-cart-breakdown-label">
              Tạm tính hàng đấu giá ({totals.auctionCount} SP):
              <i className="bi bi-hammer" aria-hidden="true"></i>
            </span>
            <span className="nx-cart-breakdown-value">
              {formatVnd(totals.auctionSubtotal)}
            </span>
          </div>

          <div className="nx-cart-breakdown-row">
            <span>Phí vận chuyển giao tận nơi:</span>
            <span className="nx-cart-breakdown-value nx-cart-breakdown-value--free">
              {shippingLabel}
            </span>
          </div>

          {voucher && (
            <div className="nx-cart-breakdown-row nx-cart-breakdown-row--discount">
              <span className="nx-cart-breakdown-label">
                Giảm giá Voucher:
                <span className="nx-cart-breakdown-code">{voucher.code}</span>
              </span>
              <span className="nx-cart-breakdown-value">
                - {formatVnd(totals.discount)}
              </span>
            </div>
          )}

          <div className="nx-cart-breakdown-divider" />

          <div className="nx-cart-total">
            <div className="nx-cart-total-label">
              <span>Tổng thanh toán:</span>
              <p>(Đã bao gồm thuế VAT &amp; bảo hiểm hàng hóa)</p>
            </div>
            <span className="nx-cart-total-amount">
              {formatVnd(totals.total)}
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="nx-cart-cta">
          <button
            type="button"
            className="nx-cart-cta-button"
            onClick={onCheckout}
            disabled={!hasItems}
          >
            <i className="bi bi-lock-fill" aria-hidden="true"></i>
            <span>Xác nhận đặt hàng (COD)</span>
          </button>
          <p className="nx-cart-cta-note">
            Nhấn &apos;Xác nhận&apos; đồng nghĩa bạn chấp thuận{' '}
            <a href="#terms">Điều khoản mua hàng &amp; Quy chế Đấu giá</a>.
          </p>
        </div>

        {/* Trust badges (FR-48) */}
        <div className="nx-cart-trust">
          <div className="nx-cart-trust-item">
            <i className="bi bi-patch-check-fill" aria-hidden="true"></i>
            <p>
              <strong>Lưu ý:</strong> Chính sách bảo hành và hoàn tiền chưa được cung cấp bởi API.
            </p>
          </div>
          <div className="nx-cart-trust-item">
            <i
              className="bi bi-shield-lock-fill nx-cart-trust-icon--tertiary"
              aria-hidden="true"
            ></i>
            <p>
              <strong>Thanh toán COD:</strong> Không thu tiền trực tuyến; thanh toán khi nhận hàng.
            </p>
          </div>
        </div>
      </div>

      {/* Help card */}
      <div className="nx-cart-help">
        <div className="nx-cart-help-main">
          <span className="nx-cart-help-icon" aria-hidden="true">
            <i className="bi bi-headset"></i>
          </span>
          <div>
            <p className="nx-cart-help-title">Cần trợ giúp thanh toán?</p>
            <p className="nx-cart-help-sub">Kênh hỗ trợ trực tuyến chưa được kết nối</p>
          </div>
        </div>
        <button
          type="button"
          className="nx-cart-help-chat"
          onClick={onSupport}
        >
          Chat ngay
        </button>
      </div>
    </div>
  );
}
