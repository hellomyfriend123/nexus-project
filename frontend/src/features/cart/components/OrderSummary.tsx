import type { FormEvent } from 'react';
import type { CartTotals, Voucher } from '../types/cart';
import { formatVnd } from '../utils/cart.format';
interface Props {
  totals: CartTotals; voucher: Voucher | null; voucherInput: string; hasItems: boolean; preparing?: boolean; blockedReason?: string;
  onVoucherInput: (value: string) => void; onApplyVoucher: () => void; onClearVoucher: () => void; onCheckout: () => void;
}
export default function OrderSummary({ totals, voucher, voucherInput, hasItems, preparing, blockedReason, onVoucherInput, onApplyVoucher, onClearVoucher, onCheckout }: Props) {
  const apply = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onApplyVoucher(); };
  return <div className="nx-cart-summary"><div className="nx-cart-summary-card">
    <h2 className="nx-cart-summary-title">Tóm tắt đơn hàng</h2>
    <div className="nx-cart-voucher"><label className="nx-cart-voucher-label" htmlFor="nx-cart-voucher">Mã giảm giá</label>
      <form className="nx-cart-voucher-form" onSubmit={apply}><div className="nx-cart-voucher-field"><input id="nx-cart-voucher" type="text" className="nx-cart-voucher-input" placeholder="Nhập mã ưu đãi" value={voucherInput} onChange={event => onVoucherInput(event.target.value)} /></div><button type="submit" className="nx-cart-voucher-apply">Áp dụng</button></form>
      {voucher && <div className="nx-cart-voucher-applied"><span>Mã {voucher.code}: giảm {formatVnd(totals.discount)}</span><button type="button" className="nx-cart-voucher-clear" aria-label="Bỏ mã giảm giá" onClick={onClearVoucher}>×</button></div>}
    </div>
    <div className="nx-cart-breakdown">
      <div className="nx-cart-breakdown-row"><span>Tiền hàng ({totals.directCount} sản phẩm)</span><span>{formatVnd(totals.directSubtotal)}</span></div>
      {voucher && <div className="nx-cart-breakdown-row nx-cart-breakdown-row--discount"><span>Giảm giá</span><span>−{formatVnd(totals.discount)}</span></div>}
      <div className="nx-cart-breakdown-row"><span>Phí giao hàng</span><span>Xác nhận khi đặt đơn</span></div>
      <div className="nx-cart-breakdown-divider" />
      <div className="nx-cart-total"><div className="nx-cart-total-label"><span>Tổng tạm tính</span></div><span className="nx-cart-total-amount">{formatVnd(totals.total)}</span></div>
    </div>
    <div className="nx-cart-cta"><button type="button" className="nx-cart-cta-button" disabled={!hasItems || preparing || !!blockedReason} aria-describedby={blockedReason ? 'cart-checkout-restriction' : undefined} onClick={onCheckout}>{preparing ? 'Đang kiểm tra giỏ hàng…' : 'Đặt hàng COD'}</button>{blockedReason && <p id="cart-checkout-restriction" className="nx-cart-seller-warning">{blockedReason}</p>}<p className="nx-cart-cta-note">Bạn sẽ kiểm tra lại đơn trước khi xác nhận.</p></div>
  </div></div>;
}

