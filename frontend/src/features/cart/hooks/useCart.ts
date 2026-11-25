import { apiErrorMessage } from '../../../services/api/client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notify } from '../../../shared/components/Toast';
import { commerceApi, type CommerceCart } from '../../../services/api/commerce';
import { buyerApi } from '../../../services/api/buyer';
import { calculateTotals } from '../utils/cart.calculation';
import { hasCartFinancialDrift, validateCheckoutAddress, validateCheckoutCart } from '../utils/cart.contract';
import { CartMutationQueue } from '../utils/cartMutationQueue';
import type { CartItem, DeliveryAddress, PaymentMethodId, ShippingMethodId, Voucher } from '../types/cart';

export function useCart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CommerceCart | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const itemsRef = useRef<CartItem[]>([]);
  itemsRef.current = items;
  const queueRef = useRef<CartMutationQueue | null>(null);
  const preparingCheckout = useRef(false);
  const [checkoutPreparing, setCheckoutPreparing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [deliveryAddress, setAddress] = useState<DeliveryAddress>({ id: '', receiverName: '', phone: '', line: '', isDefault: false, verified: false });
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const checkoutLock = useRef(false);
  const mutationLock = useRef(false);
  const cartRevision = useRef(0);
  const [shippingId] = useState<ShippingMethodId>('standard');
  const [paymentId, setPaymentId] = useState<PaymentMethodId>('cod');
  const [voucherInput, setVoucherInput] = useState('');
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const report = (error: unknown) => notify.error(apiErrorMessage(error));
  const refresh = async (next?: CommerceCart) => {
    const data = next ?? await commerceApi.cart();
    const products = await Promise.all(data.items.map(line => buyerApi.product(line.productId).catch(() => null)));
    setCart(data);
    setLoadError('');
    window.dispatchEvent(new Event("nexus:cart-changed"));
    const queue = queueRef.current;
    setItems(data.items.map((line, index) => {
      const snapshot = queue?.getSnapshot(line.id);
      const busy = snapshot !== undefined && snapshot.syncState !== 'synced';
      return { id: line.id, name: products[index]?.name ?? line.productId,
        image: products[index]?.primaryImageUrl ?? '', unitPrice: Number(line.unitPrice),
        // Items with unsynchronized optimistic changes keep the user's latest quantity.
        quantity: busy ? snapshot.desiredQuantity : line.quantity,
        maxQuantity: snapshot?.maxQuantity ?? Number.MAX_SAFE_INTEGER, mode: 'direct' as const, sellerName: line.sellerId,
        syncState: snapshot?.syncState ?? 'synced', stockState: snapshot?.stockState ?? 'available' };
    }));
    queue?.syncFromServer(data.items.map(line => ({ id: line.id, quantity: line.quantity })));
    setVoucher(null);
  };
  useEffect(() => {
    const queue = new CartMutationQueue({
      updateQuantity: commerceApi.quantity, removeItem: commerceApi.remove, fetchCart: commerceApi.cart,
      events: {
        onItemState: (id, snapshot) => setItems(current => current.map(item => item.id !== id
          || (item.syncState === snapshot.syncState && item.stockState === snapshot.stockState && item.maxQuantity === (snapshot.maxQuantity ?? Number.MAX_SAFE_INTEGER))
          ? item : { ...item, syncState: snapshot.syncState, stockState: snapshot.stockState, maxQuantity: snapshot.maxQuantity ?? Number.MAX_SAFE_INTEGER })),
        onConfirmed: data => { cartRevision.current++; setCart(data); setVoucher(null); },
        onReconciled: (id, quantity, info) => {
          setItems(current => quantity === 0 ? current.filter(item => item.id !== id) : current.map(item => item.id === id ? { ...item, quantity } : item));
          cartRevision.current++;
          setVoucher(null);
          if (info.reason === 'missing') notify.warning('Sản phẩm không còn trong giỏ hàng.');
          else if (info.reason === 'conflict') notify.warning('Giỏ hàng đã thay đổi ở nơi khác. Số lượng đã được cập nhật theo dữ liệu máy chủ.');
          else if ((info.availableQuantity ?? 1) <= 0) notify.warning('Sản phẩm đã hết hàng.');
          else notify.warning(`Chỉ còn ${info.availableQuantity ?? quantity} sản phẩm trong kho. Số lượng đã được điều chỉnh về ${quantity}.`);
        },
        onError: (_id, message) => notify.error(`Chưa đồng bộ được số lượng: ${message}`),
        onIdle: () => window.dispatchEvent(new Event('nexus:cart-changed')),
      },
    });
    queueRef.current = queue;
    return () => { queue.dispose(); queueRef.current = null; };
  }, []);
  useEffect(() => {
    let active = true;
    // Profile is optional address prefill; its failure must not hide a valid cart.
    Promise.all([commerceApi.cart(), buyerApi.profile().catch(error => { if (active) report(error); return null; })]).then(async ([data, profile]) => {
      if (!active) return;
      if (profile) setAddress({ id: profile.id, receiverName: profile.fullName ?? profile.username, phone: profile.phone ?? '', line: profile.address ?? '', isDefault: true, verified: false });
      await refresh(data);
    }).catch(error => { if (active) { setLoadError(error instanceof Error ? error.message : 'Không thể tải giỏ hàng.'); report(error); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const mutate = async (operation: () => Promise<void>) => {
    if (mutationLock.current || checkoutLock.current) return;
    mutationLock.current = true;
    try { await operation(); } catch (error) { report(error); } finally { mutationLock.current = false; }
  };
  const refreshAfterMutation = async (next?: CommerceCart) => {
    try { await refresh(next); }
    catch {
      notify.warning('Máy chủ đã lưu thay đổi, nhưng chưa thể tải lại giỏ hàng. Vui lòng tải lại trang; không cần gửi lại thao tác.');
      setLoadError('Thay đổi đã được lưu. Vui lòng tải lại trang để xem giỏ hàng mới nhất.');
    }
  };
  const handleRemove = useCallback((id: string) => {
    const queue = queueRef.current;
    if (!queue || checkoutLock.current) return;
    cartRevision.current++;
    setItems(current => current.filter(item => item.id !== id));
    setVoucher(null);
    queue.remove(id)
      .then(async () => { notify.success('Đã xóa sản phẩm khỏi giỏ hàng.'); await refreshAfterMutation(); })
      .catch(async error => { report(error); await refreshAfterMutation(); });
  }, []);
  /** Optimistic: the UI changes immediately; the per-item queue syncs the latest value with the Backend. */
  const handleQuantityChange = useCallback((id: string, quantity: number) => {
    const queue = queueRef.current;
    const current = itemsRef.current.find(item => item.id === id);
    if (!queue || !current || checkoutLock.current) return;
    if (quantity <= 0) { handleRemove(id); return; }
    const next = Math.min(Math.trunc(quantity), current.maxQuantity);
    if (next < Math.trunc(quantity)) notify.warning(`Chỉ còn ${current.maxQuantity} sản phẩm trong kho.`, { toastId: `stock-${id}` });
    if (next === current.quantity) return;
    cartRevision.current++;
    setItems(list => list.map(item => item.id === id ? { ...item, quantity: next, syncState: 'pending' } : item));
    setVoucher(null);
    queue.setQuantity(id, next);
  }, [handleRemove]);
  const handleRetry = useCallback((id: string) => queueRef.current?.retry(id), []);
  /** Wait for pending CartItem mutations, then verify the authoritative cart before checkout. */
  const syncBeforeCheckout = async (): Promise<boolean> => {
    const queue = queueRef.current;
    if (!queue) return false;
    const { ok } = await queue.settle();
    if (!ok) { notify.warning('Một số thay đổi số lượng chưa được đồng bộ. Hãy thử lại từng sản phẩm hoặc tải lại giỏ hàng trước khi đặt hàng.'); return false; }
    try {
      const latest = await commerceApi.cart();
      const invalidCart = validateCheckoutCart(latest);
      if (invalidCart) { notify.warning(invalidCart); return false; }
      const drift = hasCartFinancialDrift(cart, latest) || latest.items.length !== queue.size() || latest.items.some(line => queue.getSnapshot(line.id)?.confirmedQuantity !== line.quantity);
      if (drift) {
        await refresh(latest);
        notify.warning('Giỏ hàng đã được cập nhật theo dữ liệu máy chủ. Vui lòng kiểm tra lại trước khi đặt hàng.');
        return false;
      }
      return true;
    } catch (error) { report(error); return false; }
  };
  const handleSaveForLater = (_id: string) => notify.info('Backend chưa hỗ trợ danh sách lưu sau. Sản phẩm vẫn ở trong giỏ hàng.');
  const setShippingId = (_id: ShippingMethodId) => notify.info('Backend chưa hỗ trợ lựa chọn dịch vụ giao hàng. Phí cuối cùng do máy chủ tính khi đặt đơn.');
  const totals = useMemo(() => calculateTotals(items, { shippingFee: 0, voucher }), [items, voucher]);
  const handleApplyVoucher = () => void mutate(async () => {
    if (!voucherInput.trim()) { notify.warning('Vui lòng nhập mã giảm giá.'); return; }
    const queue = queueRef.current;
    if (!queue) return;
    const { ok } = await queue.settle();
    if (!ok) { notify.warning('Vui lòng đồng bộ giỏ hàng trước khi áp dụng mã giảm giá.'); return; }
    const revision = cartRevision.current;
    const latest = await commerceApi.cart();
    if (revision !== cartRevision.current) return;
    await refresh(latest);
    if (revision !== cartRevision.current) return;
    const result = await commerceApi.discount(voucherInput.trim(), Number(latest.subtotal));
    if (revision !== cartRevision.current) return;
    setVoucher({ code: result.code, discount: Number(result.discountAmount), description: 'Được xác nhận bởi máy chủ', directOnly: true });
    notify.success('Đã áp dụng mã giảm giá.');
  });
  const handleClearVoucher = () => { cartRevision.current++; setVoucher(null); setVoucherInput(''); };
  const handleChangeAddress = () => {
    const receiverName = window.prompt('Tên người nhận', deliveryAddress.receiverName);
    if (receiverName === null) return;
    const phone = window.prompt('Số điện thoại người nhận', deliveryAddress.phone);
    if (phone === null) return;
    const line = window.prompt('Địa chỉ nhận hàng', deliveryAddress.line);
    if (line === null) return;
    setAddress(current => ({ ...current, receiverName: receiverName.trim(), phone: phone.trim(), line: line.trim(), verified: false }));
  };
  const handleSupport = () => notify.info('Backend chưa hỗ trợ chat trực tuyến.');
  const handleCheckout = async () => {
    if (mutationLock.current || checkoutLock.current || preparingCheckout.current) return;
    if (!items.length) { notify.warning('Giỏ hàng đang trống.'); return; }
    if (paymentId !== 'cod') { notify.warning('Cổng VNPay, thẻ và MoMo chưa được backend hỗ trợ. Vui lòng chọn COD.'); return; }
    const invalidAddress = validateCheckoutAddress({ receiverName: deliveryAddress.receiverName, receiverPhone: deliveryAddress.phone, shippingAddress: deliveryAddress.line });
    if (invalidAddress) { notify.warning(invalidAddress); return; }
    preparingCheckout.current = true; setCheckoutPreparing(true);
    try { if (await syncBeforeCheckout()) setCheckoutOpen(true); }
    finally { preparingCheckout.current = false; setCheckoutPreparing(false); }
  };
  const cancelCheckout = () => { if (!checkoutLock.current) setCheckoutOpen(false); };
  const confirmCheckout = async () => {
    if (checkoutLock.current || mutationLock.current || !checkoutOpen) return;
    checkoutLock.current = true;
    try {
      if (!(await syncBeforeCheckout())) { setCheckoutOpen(false); return; }
      const order = await commerceApi.checkout({ receiverName: deliveryAddress.receiverName, receiverPhone: deliveryAddress.phone,
        shippingAddress: deliveryAddress.line, paymentMethod: 'COD', ...(voucher ? { discountCode: voucher.code } : {}) });
      notify.success(`Đã tạo đơn ${order.orderNumber}. Thanh toán COD khi nhận hàng.`);
      window.dispatchEvent(new Event("nexus:cart-changed"));
      setCheckoutOpen(false); setItems([]); navigate('/buyer-hub');
    } catch (error) { report(error); } finally { checkoutLock.current = false; }
  };
  return { items, loading, loadError, deliveryAddress, cartSessionCode: cart?.id ?? '—', shippingId, setShippingId, paymentId, setPaymentId,
    voucherInput, setVoucherInput, voucher, hasAuctionItems: false, totals, itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    shippingLabel: 'Theo đơn hàng máy chủ', handleQuantityChange, handleRemove, handleSaveForLater, handleApplyVoucher, handleClearVoucher,
    handleChangeAddress, handleSupport, handleCheckout, handleRetry, checkoutPreparing, checkoutOpen, cancelCheckout, confirmCheckout };
}
