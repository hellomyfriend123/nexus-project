import { Link } from 'react-router-dom';
import VNPaySandboxModal from '../../payment/components/VNPaySandboxModal';
import CheckoutConfirmation from '../components/CheckoutConfirmation';
import CartEmptyState from '../components/CartEmptyState';
import CartItemRow from '../components/CartItemRow';
import OrderSummary from '../components/OrderSummary';
import ShippingAddressCard from '../components/ShippingAddressCard';
import ShippingAddressDialog from '../components/ShippingAddressDialog';
import { useCart } from '../hooks/useCart';
import { useCartSession } from '../hooks/useCartSession';

export default function CartPage() {
  const token = useCartSession();
  if (!token) return <main className="nx-cart-page"><div className="nx-container"><h1>Giỏ hàng của bạn</h1><p>Đăng nhập để xem giỏ hàng của bạn.</p><Link className="nx-button nx-button-primary" to="/login">Đăng nhập</Link> <Link to="/products">Tiếp tục mua sắm →</Link></div></main>;
  return <SessionCart key={token} />;
}

function SessionCart() {
  const cart = useCart();
  return <main className="nx-cart-page">
    {cart.addressOpen && <ShippingAddressDialog address={cart.deliveryAddress} onClose={cart.closeAddress} onSave={cart.saveAddress} />}
    <CheckoutConfirmation open={cart.checkoutOpen} submitting={cart.checkoutSubmitting} itemCount={cart.itemCount} total={cart.totals.total} paymentId={cart.paymentId} onCancel={cart.cancelCheckout} onConfirm={cart.confirmCheckout} />
    {cart.vnpayOrder && (
      <VNPaySandboxModal
        orderId={cart.vnpayOrder.id}
        orderNumber={cart.vnpayOrder.orderNumber}
        amount={cart.vnpayOrder.amount}
        onSuccess={cart.handleVnpaySuccess}
        onClose={cart.closeVnpayModal}
      />
    )}
    <div className="nx-container">
      <header className="nx-cart-heading"><div><h1>Giỏ hàng của bạn</h1><p>Kiểm tra sản phẩm và địa chỉ trước khi đặt hàng.</p></div><Link to="/products">Tiếp tục mua sắm →</Link></header>
      {cart.loading ? <p role="status">Đang tải giỏ hàng…</p> : cart.loadError ? <p role="alert">{cart.loadError}</p> : !cart.items.length ? <CartEmptyState /> : <div className="nx-cart-layout">
        <div className="nx-cart-main">
          <section className="nx-cart-section" aria-labelledby="cart-items-title">
            <header className="nx-cart-section-head"><h2 id="cart-items-title">Sản phẩm <span className="nx-cart-section-count">{cart.itemCount}</span></h2></header>
            {cart.sellerGroups.map((group, index) => <section className="nx-cart-seller-group" key={group.sellerId} aria-label={`Nhóm người bán ${index + 1}`}>
              <h3 className="nx-cart-seller-title">Người bán {index + 1}</h3>
              <div className="nx-cart-items">{group.items.map(item => <CartItemRow key={item.id} item={item} onQuantityChange={cart.handleQuantityChange} onRemove={cart.handleRemove} onRetry={cart.handleRetry} />)}</div>
            </section>)}
            {cart.multipleSellers && <p className="nx-cart-seller-warning" role="status">Giỏ hàng có sản phẩm từ nhiều người bán. Để đặt hàng, hãy giữ lại một nhóm và xóa sản phẩm trong các nhóm còn lại. Các sản phẩm bị xóa sẽ không được giữ trong giỏ.</p>}
            <p className="nx-cart-section-note">Mỗi đơn hàng hỗ trợ sản phẩm từ một người bán.</p>
          </section>
          <section className="nx-cart-section" aria-labelledby="cart-address-title">
            <header className="nx-cart-section-head"><h2 id="cart-address-title">Địa chỉ nhận hàng</h2><button type="button" className="nx-cart-section-action" onClick={cart.handleChangeAddress}>Thay đổi</button></header>
            <ShippingAddressCard address={cart.deliveryAddress} />
          </section>
          <section className="nx-cart-section" aria-labelledby="cart-payment-title">
            <header className="nx-cart-section-head"><h2 id="cart-payment-title">Thanh toán</h2></header>
            <div className="d-flex flex-column gap-2">
              <label
                className={`p-3 rounded-3 border d-flex align-items-start gap-3 ${cart.paymentId === 'cod' ? 'border-primary bg-primary-subtle' : 'bg-white'}`}
                style={{ cursor: 'pointer' }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  className="form-check-input mt-1"
                  checked={cart.paymentId === 'cod'}
                  onChange={() => cart.setPaymentId('cod')}
                />
                <div>
                  <div className="fw-semibold">
                    <i className="bi bi-cash-coin me-2" aria-hidden="true" />
                    Thanh toán khi nhận hàng (COD)
                  </div>
                  <div className="small text-secondary">Bạn thanh toán cho đơn vị giao hàng khi nhận sản phẩm.</div>
                </div>
              </label>

              <label
                className={`p-3 rounded-3 border d-flex align-items-start gap-3 ${cart.paymentId === 'vnpay' ? 'border-primary bg-primary-subtle' : 'bg-white'}`}
                style={{ cursor: 'pointer' }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  className="form-check-input mt-1"
                  checked={cart.paymentId === 'vnpay'}
                  onChange={() => cart.setPaymentId('vnpay')}
                />
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span
                      className="px-2 py-0 rounded fw-bold text-danger bg-white border"
                      style={{ fontSize: 12, letterSpacing: 0.5 }}
                    >
                      VN<span style={{ color: '#005baa' }}>PAY</span>
                    </span>
                    <span className="fw-semibold">Thanh toán trực tuyến qua VNPAY</span>
                    <span className="badge bg-info text-dark">Sandbox</span>
                  </div>
                  <div className="small text-secondary mt-1">
                    Mô phỏng cổng thanh toán VNPAY bằng thẻ ATM nội địa NCB test &amp; mã OTP thử nghiệm.
                  </div>
                </div>
              </label>
            </div>
          </section>
        </div>
        <aside className="nx-cart-summary-col"><OrderSummary totals={cart.totals} voucher={cart.voucher} voucherInput={cart.voucherInput} hasItems={cart.items.length > 0} blockedReason={cart.multipleSellers ? 'Chỉ có thể đặt sản phẩm của một người bán mỗi lần.' : undefined} preparing={cart.checkoutPreparing} paymentId={cart.paymentId} onVoucherInput={cart.setVoucherInput} onApplyVoucher={cart.handleApplyVoucher} onClearVoucher={cart.handleClearVoucher} onCheckout={cart.handleCheckout} /></aside>
      </div>}
    </div>
  </main>;
}

