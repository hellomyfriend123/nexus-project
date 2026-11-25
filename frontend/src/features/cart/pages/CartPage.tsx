import CheckoutConfirmation from '../components/CheckoutConfirmation';
import AuctionWinBanner from '../components/AuctionWinBanner';
import CartEmptyState from '../components/CartEmptyState';
import CartItemRow from '../components/CartItemRow';
import CartStepper from '../components/CartStepper';
import OrderSummary from '../components/OrderSummary';
import PaymentMethods from '../components/PaymentMethods';
import ShippingAddressCard from '../components/ShippingAddressCard';
import ShippingOptions from '../components/ShippingOptions';
import { useCart } from '../hooks/useCart';
import { paymentMethods, shippingMethods } from '../constants/cart.constants';

/** Buyer cart page: presentation only; state and actions live in useCart. */
export default function CartPage() {
  const {
    items, loading, loadError, deliveryAddress, cartSessionCode, shippingId, setShippingId, paymentId, setPaymentId,
    voucherInput, setVoucherInput, voucher, hasAuctionItems, totals, itemCount,
    shippingLabel, handleQuantityChange, handleRemove, handleSaveForLater,
    handleApplyVoucher, handleClearVoucher, handleChangeAddress, handleSupport,
    handleCheckout, handleRetry, checkoutOpen, cancelCheckout, confirmCheckout,
  } = useCart();

  return (
    <main className="nx-cart-page">
      <CheckoutConfirmation
        open={checkoutOpen} itemCount={itemCount} total={totals.total}
        onCancel={cancelCheckout} onConfirm={confirmCheckout}
      />
      <div className="nx-container">
        <p className="alert alert-info" role="note">Đơn hàng được gửi tới máy chủ. Hiện hỗ trợ COD; thanh toán trực tuyến và lựa chọn giao vận chưa được hỗ trợ. Máy chủ tính tổng từ dữ liệu giỏ hàng; việc kiểm tra giá catalog và tồn kho trực tiếp chưa được backend tích hợp. Mỗi lần đặt hàng chỉ hỗ trợ một người bán.</p>
        {/* Flow progress */}
        <div className="nx-cart-topbar">

          <CartStepper current={1} />
        </div>

        {hasAuctionItems && <AuctionWinBanner />}

        {loading ? <p role="status">Đang tải giỏ hàng...</p> : loadError ? <p role="alert">{loadError}</p> : items.length === 0 ? (
          <CartEmptyState />
        ) : (
          <div className="nx-cart-layout">
            {/* LEFT: cart → address → payment */}
            <div className="nx-cart-main">
              <section className="nx-cart-section">
                <header className="nx-cart-section-head">
                  <div className="nx-cart-section-title">
                    <span
                      className="nx-cart-section-mark"
                      aria-hidden="true"
                    ></span>
                    <h1>1. Giỏ hàng của bạn</h1>
                    <span className="nx-cart-section-count">
                      {itemCount} sản phẩm
                    </span>
                  </div>
                  <span className="nx-cart-session">
                    Mã phiên: {cartSessionCode}
                  </span>
                </header>

                <div className="nx-cart-items">
                  {items.map((item) => (
                    <CartItemRow
                      key={item.id}
                      item={item}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemove}
                      onSaveForLater={handleSaveForLater}
                      onRetry={handleRetry}
                    />
                  ))}
                </div>
              </section>

              <section className="nx-cart-section">
                <header className="nx-cart-section-head">
                  <div className="nx-cart-section-title">
                    <span
                      className="nx-cart-section-mark"
                      aria-hidden="true"
                    ></span>
                    <h2>2. Địa chỉ nhận hàng &amp; Giao vận</h2>
                  </div>
                  <button
                    type="button"
                    className="nx-cart-section-action"
                    onClick={handleChangeAddress}
                  >
                    <i className="bi bi-geo-alt" aria-hidden="true"></i>
                    <span>Thay đổi địa chỉ</span>
                  </button>
                </header>

                <ShippingAddressCard address={deliveryAddress} />
                <ShippingOptions
                  methods={shippingMethods}
                  value={shippingId}
                  onChange={setShippingId}
                />
              </section>

              <section className="nx-cart-section">
                <header className="nx-cart-section-head">
                  <div className="nx-cart-section-title">
                    <span
                      className="nx-cart-section-mark"
                      aria-hidden="true"
                    ></span>
                    <h2>3. Phương thức thanh toán an toàn</h2>
                  </div>
                  <span className="nx-cart-section-note">
                    <i className="bi bi-shield-check" aria-hidden="true"></i>
                    <span>Bảo mật chuẩn PCI-DSS Level 1</span>
                  </span>
                </header>

                <PaymentMethods
                  methods={paymentMethods}
                  value={paymentId}
                  onChange={setPaymentId}
                  hasAuctionItems={hasAuctionItems}
                />
              </section>
            </div>

            {/* RIGHT: sticky summary */}
            <aside className="nx-cart-summary-col">
              <OrderSummary
                totals={totals}
                voucher={voucher}
                voucherInput={voucherInput}
                shippingLabel={shippingLabel}
                hasItems={items.length > 0}
                onVoucherInput={setVoucherInput}
                onApplyVoucher={handleApplyVoucher}
                onClearVoucher={handleClearVoucher}
                onCheckout={handleCheckout}
                onSupport={handleSupport}
              />
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
