import { apiErrorMessage } from '../../../services/api/client';
import { getSession } from '../../../services/api/auth';
import { CartRequestScope } from '../utils/cartRequestScope';
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
  const [scope] = useState(() => new CartRequestScope(getSession()?.accessToken ?? null, () => getSession()?.accessToken ?? null));
  const [api] = useState(() => ({
    cart: scope.bind(commerceApi.cart), quantity: scope.bind(commerceApi.quantity),
    remove: scope.bind(commerceApi.remove), discount: scope.bind(commerceApi.discount),
    checkout: scope.bind(commerceApi.checkout), profile: scope.bind(buyerApi.profile), product: scope.bind(buyerApi.product),
  }));
  useEffect(() => { scope.activate(); return () => scope.dispose(); }, [scope]);
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
  const [addressOpen, setAddressOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const checkoutLock = useRef(false);
  const mutationLock = useRef(false);
  const cartRevision = useRef(0);
  const [shippingId] = useState<ShippingMethodId>('standard');
  const [paymentId, setPaymentId] = useState<PaymentMethodId>('cod');
  const [vnpayOrder, setVnpayOrder] = useState<{ id: string; orderNumber: string; amount: number } | null>(null);
  const [voucherInput, setVoucherInput] = useState('');
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const report = useCallback((error: unknown) => { if (scope.current() && !(error instanceof DOMException && error.name === 'AbortError')) notify.error(apiErrorMessage(error)); }, [scope]);
  const refresh = useCallback(async (next?: CommerceCart) => {
    const accept = scope.beginRefresh(cartRevision.current, () => cartRevision.current);
    const data = next ?? await api.cart();
    const products = await Promise.all(data.items.map(line => api.product(line.productId).catch(() => null)));
    if (!accept()) return false;
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
    return true;
  }, [api, scope]);
  useEffect(() => {
    const queue = new CartMutationQueue({
      updateQuantity: api.quantity, removeItem: api.remove, fetchCart: api.cart,
      events: {
        onItemState: (id, snapshot) => scope.current() && setItems(current => current.map(item => item.id !== id
          || (item.syncState === snapshot.syncState && item.stockState === snapshot.stockState && item.maxQuantity === (snapshot.maxQuantity ?? Number.MAX_SAFE_INTEGER))
          ? item : { ...item, syncState: snapshot.syncState, stockState: snapshot.stockState, maxQuantity: snapshot.maxQuantity ?? Number.MAX_SAFE_INTEGER })),
        onConfirmed: data => { if (!scope.current()) return; cartRevision.current++; setCart(data); setVoucher(null); },
        onReconciled: (id, quantity, info) => {
          if (!scope.current()) return;
          setItems(current => quantity === 0 ? current.filter(item => item.id !== id) : current.map(item => item.id === id ? { ...item, quantity } : item));
          cartRevision.current++;
          setVoucher(null);
          if (info.reason === 'missing') notify.warning('Sản phẩm không còn trong giỏ hàng.');
          else if (info.reason === 'conflict') notify.warning('Giỏ hàng đã thay đổi ở nơi khác. Số lượng đã được cập nhật theo dữ liệu máy chủ.');
          else if ((info.availableQuantity ?? 1) <= 0) notify.warning('Sản phẩm đã hết hàng.');
          else notify.warning(`Chỉ còn ${info.availableQuantity ?? quantity} sản phẩm trong kho. Số lượng đã được điều chỉnh về ${quantity}.`);
        },
        onError: (_id, message) => scope.current() && notify.error(`Chưa đồng bộ được số lượng: ${message}`),
        onIdle: () => scope.current() && window.dispatchEvent(new Event('nexus:cart-changed')),
      },
    });
    queueRef.current = queue;
    return () => { queue.dispose(); queueRef.current = null; };
  }, [api, scope]);
  useEffect(() => {
    let active = true;
    // Profile is optional address prefill; its failure must not hide a valid cart.
    Promise.all([api.cart(), api.profile().catch(error => { if (active && scope.current()) report(error); return null; })]).then(async ([data, profile]) => {
      if (!active || !scope.current()) return;
      if (profile) setAddress({ id: profile.id, receiverName: profile.fullName ?? profile.username, phone: profile.phone ?? '', line: profile.address ?? '', isDefault: true, verified: false });
      await refresh(data);
    }).catch(error => { if (active && scope.current()) { setLoadError(error instanceof Error ? error.message : 'Không thể tải giỏ hàng.'); report(error); } })
      .finally(() => { if (active && scope.current()) setLoading(false); });
    return () => { active = false; };
  }, [api, scope, report, refresh]);
  const mutate = async (operation: () => Promise<void>) => {
    if (!scope.current() || mutationLock.current || checkoutLock.current) return;
    mutationLock.current = true;
    try { await operation(); } catch (error) { report(error); } finally { mutationLock.current = false; }
  };
  const refreshAfterMutation = useCallback(async (next?: CommerceCart) => {
    try { await queueRef.current?.settle(); if (scope.current()) await refresh(next); }
    catch {
      if (!scope.current()) return;
      notify.warning('Máy chủ đã lưu thay đổi, nhưng chưa thể tải lại giỏ hàng. Vui lòng tải lại trang; không cần gửi lại thao tác.');
      setLoadError('Thay đổi đã được lưu. Vui lòng tải lại trang để xem giỏ hàng mới nhất.');
    }
  }, [scope, refresh]);
  const handleRemove = useCallback((id: string) => {
    const queue = queueRef.current;
    if (!scope.current() || !queue || checkoutLock.current) return;
    cartRevision.current++;
    setItems(current => current.filter(item => item.id !== id));
    setVoucher(null);
    queue.remove(id)
      .then(async () => { if (!scope.current()) return; cartRevision.current++; notify.success('Đã xóa sản phẩm khỏi giỏ hàng.'); await refreshAfterMutation(); })
      .catch(async error => { if (!scope.current()) return; cartRevision.current++; report(error); await refreshAfterMutation(); });
  }, [scope, report, refreshAfterMutation]);
  /** Optimistic: the UI changes immediately; the per-item queue syncs the latest value with the Backend. */
  const handleQuantityChange = useCallback((id: string, quantity: number) => {
    const queue = queueRef.current;
    const current = itemsRef.current.find(item => item.id === id);
    if (!scope.current() || !queue || !current || checkoutLock.current) return;
    if (quantity <= 0) { handleRemove(id); return; }
    const next = Math.min(Math.trunc(quantity), current.maxQuantity);
    if (next < Math.trunc(quantity)) notify.warning(`Chỉ còn ${current.maxQuantity} sản phẩm trong kho.`, { toastId: `stock-${id}` });
    if (next === current.quantity) return;
    cartRevision.current++;
    setItems(list => list.map(item => item.id === id ? { ...item, quantity: next, syncState: 'pending' } : item));
    setVoucher(null);
    queue.setQuantity(id, next);
  }, [handleRemove, scope]);
  const handleRetry = useCallback((id: string) => { if (scope.current()) queueRef.current?.retry(id); }, [scope]);
  /** Wait for pending CartItem mutations, then verify the authoritative cart before checkout. */
  const syncBeforeCheckout = async (): Promise<boolean> => {
    const queue = queueRef.current;
    if (!scope.current() || !queue) return false;
    const { ok } = await queue.settle();
    if (!scope.current()) return false;
    if (!ok) { notify.warning('Một số thay đổi số lượng chưa được đồng bộ. Hãy thử lại từng sản phẩm hoặc tải lại giỏ hàng trước khi đặt hàng.'); return false; }
    try {
      const latest = await api.cart();
      const invalidCart = validateCheckoutCart(latest);
      if (invalidCart) { notify.warning(invalidCart); return false; }
      const drift = hasCartFinancialDrift(cart, latest) || latest.items.length !== queue.size() || latest.items.some(line => queue.getSnapshot(line.id)?.confirmedQuantity !== line.quantity);
      if (drift) {
        await refresh(latest);
        if (!scope.current()) return false;
        notify.warning('Giỏ hàng đã được cập nhật theo dữ liệu máy chủ. Vui lòng kiểm tra lại trước khi đặt hàng.');
        return false;
      }
      return true;
    } catch (error) { report(error); return false; }
  };
  const handleSaveForLater = (_id: string) => notify.info('Lưu sản phẩm để mua sau chưa được hỗ trợ. Sản phẩm vẫn ở trong giỏ hàng.');
  const setShippingId = (_id: ShippingMethodId) => notify.info('Lựa chọn dịch vụ giao hàng chưa được hỗ trợ. Phí cuối cùng được tính khi đặt đơn.');
  const sellerGroups = useMemo(() => {
    const groups = new Map<string, CartItem[]>();
    for (const item of items) groups.set(item.sellerName, [...(groups.get(item.sellerName) ?? []), item]);
    return [...groups].map(([sellerId, lines]) => ({ sellerId, items: lines }));
  }, [items]);
  const multipleSellers = sellerGroups.length > 1;
  const totals = useMemo(() => calculateTotals(items, { shippingFee: 0, voucher }), [items, voucher]);
  const handleApplyVoucher = () => void mutate(async () => {
    if (!voucherInput.trim()) { notify.warning('Vui lòng nhập mã giảm giá.'); return; }
    const queue = queueRef.current;
    if (!queue) return;
    const { ok } = await queue.settle();
    if (!scope.current()) return;
    if (!ok) { notify.warning('Vui lòng đồng bộ giỏ hàng trước khi áp dụng mã giảm giá.'); return; }
    const revision = cartRevision.current;
    const latest = await api.cart();
    if (!scope.current() || revision !== cartRevision.current) return;
    if (!(await refresh(latest))) return;
    if (!scope.current() || revision !== cartRevision.current) return;
    const result = await api.discount(voucherInput.trim(), Number(latest.subtotal));
    if (!scope.current() || revision !== cartRevision.current) return;
    setVoucher({ code: result.code, discount: Number(result.discountAmount), description: 'Được xác nhận bởi máy chủ', directOnly: true });
    notify.success('Đã áp dụng mã giảm giá.');
  });
  const handleClearVoucher = () => { cartRevision.current++; setVoucher(null); setVoucherInput(''); };
  const handleChangeAddress = () => setAddressOpen(true);
  const saveAddress = (receiverName: string, phone: string, line: string) => {
    const error = validateCheckoutAddress({ receiverName, receiverPhone: phone, shippingAddress: line });
    if (error) return error;
    setAddress(current => ({ ...current, receiverName: receiverName.trim(), phone: phone.trim(), line: line.trim(), isDefault: false, verified: false }));
    setAddressOpen(false);
    return '';
  };
  const handleSupport = () => notify.info('Chat trực tuyến chưa được hỗ trợ.');
  const handleCheckout = async () => {
    if (!scope.current() || mutationLock.current || checkoutLock.current || preparingCheckout.current) return;
    if (multipleSellers) { notify.warning('Vui lòng giữ sản phẩm của một người bán trước khi đặt hàng.'); return; }
    if (!items.length) { notify.warning('Giỏ hàng đang trống.'); return; }
    if (paymentId !== 'cod' && paymentId !== 'vnpay') { notify.warning('Thanh toán qua thẻ và MoMo chưa được hỗ trợ. Vui lòng chọn COD hoặc VNPAY Sandbox.'); return; }
    const invalidAddress = validateCheckoutAddress({ receiverName: deliveryAddress.receiverName, receiverPhone: deliveryAddress.phone, shippingAddress: deliveryAddress.line });
    if (invalidAddress) { notify.warning(invalidAddress); return; }
    preparingCheckout.current = true; setCheckoutPreparing(true);
    try { if (await syncBeforeCheckout() && scope.current()) setCheckoutOpen(true); }
    finally { preparingCheckout.current = false; if (scope.current()) setCheckoutPreparing(false); }
  };
  const cancelCheckout = () => { if (!checkoutLock.current) setCheckoutOpen(false); };
  const confirmCheckout = async () => {
    if (!scope.current() || checkoutLock.current || mutationLock.current || !checkoutOpen) return;
    checkoutLock.current = true;
    setCheckoutSubmitting(true);
    try {
      if (!(await syncBeforeCheckout())) { setCheckoutOpen(false); return; }
      if (!scope.current()) return;
      const isVnpay = paymentId === 'vnpay';
      const order = await api.checkout({ receiverName: deliveryAddress.receiverName, receiverPhone: deliveryAddress.phone,
        shippingAddress: deliveryAddress.line, paymentMethod: isVnpay ? 'MOCK' : 'COD', ...(voucher ? { discountCode: voucher.code } : {}) });
      if (!scope.current()) return;
      window.dispatchEvent(new Event("nexus:cart-changed"));
      setCheckoutOpen(false); setItems([]);
      if (isVnpay) {
        setVnpayOrder({ id: order.id, orderNumber: order.orderNumber, amount: order.totalAmount });
      } else {
        notify.success(`Đã tạo đơn ${order.orderNumber}. Thanh toán COD khi nhận hàng.`);
        navigate('/buyer-hub');
      }
    } catch (error) { report(error); } finally { checkoutLock.current = false; if (scope.current()) setCheckoutSubmitting(false); }
  };
  const handleVnpaySuccess = () => {
    notify.success(`Thanh toán VNPAY thành công cho đơn ${vnpayOrder?.orderNumber ?? ''}.`);
  };
  const closeVnpayModal = () => {
    setVnpayOrder(null);
    navigate('/buyer-hub');
  };
  return { sellerGroups, multipleSellers, items, loading, loadError, deliveryAddress, cartSessionCode: cart?.id ?? 'N/A', shippingId, setShippingId, paymentId, setPaymentId,
    vnpayOrder, handleVnpaySuccess, closeVnpayModal,
    voucherInput, setVoucherInput, voucher, hasAuctionItems: false, totals, itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    shippingLabel: 'Theo đơn hàng máy chủ', handleQuantityChange, handleRemove, handleSaveForLater, handleApplyVoucher, handleClearVoucher,
    handleChangeAddress, addressOpen, closeAddress: () => setAddressOpen(false), saveAddress, handleSupport, handleCheckout, handleRetry, checkoutPreparing, checkoutSubmitting, checkoutOpen, cancelCheckout, confirmCheckout };
}
