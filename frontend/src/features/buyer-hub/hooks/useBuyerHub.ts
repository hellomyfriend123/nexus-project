import { apiErrorMessage } from '../../../services/api/client';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { notify } from '../../../shared/components/Toast';
import { commerceApi, type CommerceOrder } from '../../../services/api/commerce';
import { buyerApi, type BuyerProfileResponse } from '../../../services/api/buyer';
import type { AuctionFilterId, BidStatus, BuyerBid, BuyerHubTabId, BuyerOrder, BuyerProfile, C2cDraft, OrderFilterId, SavedItem } from '../types/buyerHub';
const initialDraft: C2cDraft = { name: '', category: '', duration: '', startPrice: '', stepPrice: '', escrow: false };
// TODO backend: personal auction list, saved items, C2C, wallet and support APIs are not exposed.
const unavailable = () => notify.info('Backend chưa cung cấp chức năng này. Không có thay đổi nào được thực hiện.');
const report = (error: unknown) => notify.error(apiErrorMessage(error));

export function useBuyerHub() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<BuyerHubTabId>(() => { const tab = searchParams.get('tab'); return tab === 'saved' || tab === 'cart' ? 'cart' : tab === 'auctions' || tab === 'c2c' ? tab : 'orders'; });
  const [auctionFilter, setAuctionFilter] = useState<AuctionFilterId>('all');
  const [orderFilter, setOrderFilter] = useState<OrderFilterId>('all');
  const [auctionSearch, setAuctionSearch] = useState('');
  const [orders, setOrders] = useState<CommerceOrder[]>([]);
  const [profile, setProfile] = useState<BuyerProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [c2cDraft, setC2cDraft] = useState<C2cDraft>(initialDraft);
  const refreshOrders = async () => {
    const first = await commerceApi.orders();
    // Bound concurrent requests: the existing UI displays all orders without pagination.
    const summaries = [...first.content];
    for (let page = 1; page < first.totalPages; page++) summaries.push(...(await commerceApi.orders(page)).content);
    const details: CommerceOrder[] = [];
    for (let index = 0; index < summaries.length; index += 5) {
      details.push(...await Promise.all(summaries.slice(index, index + 5).map(order => commerceApi.order(order.id))));
    }
    setOrders(details);
  };
  useEffect(() => {
    let active = true;
    const onError = (error: unknown) => { if (active) { setLoadError(apiErrorMessage(error)); report(error); } };
    // Load independently so unavailable profile data does not discard real orders.
    Promise.all([refreshOrders().catch(onError), buyerApi.profile().then(value => { if (active) setProfile(value); }).catch(onError)])
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const buyerProfile: BuyerProfile = { name: profile?.fullName ?? profile?.username ?? '—', initial: (profile?.fullName ?? profile?.username ?? '?').slice(0, 1),
    verified: false, memberTier: '—', memberId: profile?.id ?? '—', rating: '—', reviewCount: null, winPaymentRate: '—',
    joinedAt: profile ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : '—', walletBalance: null, voucherCount: null };
  const bids: BuyerBid[] = [];
  const items: SavedItem[] = [];
  const visibleOrders = useMemo<BuyerOrder[]>(() => orders.filter(order => orderFilter === 'all' || order.status.toLowerCase() === orderFilter)
    .map(order => ({ id: order.id, code: order.orderNumber, tag: { text: order.orderType, tone: 'primary' },
      placedNote: new Date(order.createdAt).toLocaleString('vi-VN'), status: { text: order.status, icon: 'bi-box-seam', tone: 'primary' },
      state: order.status.toLowerCase() as BuyerOrder['state'], title: order.items.map(item => item.productNameSnapshot || item.productId).join(', '),
      meta: `${order.items.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm · ${order.shippingAddress}`,
      price: Number(order.totalAmount), thumbIcon: 'bi-box-seam', thumbTone: 'primary' })), [orders, orderFilter]);
  const findOrder = (code: string) => orders.find(order => order.orderNumber === code);
  const handleTrackShipment = async (code: string) => {
    const order = findOrder(code); if (!order) return;
    try { const shipments = await buyerApi.shipments(order.id); notify.info(shipments.length ? shipments.map(s => `${s.trackingNumber ?? 'Chưa có mã vận đơn'}: ${s.status}`).join('\n') : 'Đơn hàng chưa có vận đơn.'); } catch (error) { report(error); }
  };
  const [busy, setBusy] = useState(false);
  const handleCancelOrder = async (code: string) => {
    const order = findOrder(code); if (!order || busy) return;
    if (['COMPLETED', 'CANCELLED'].includes(order.status)) { notify.warning('Đơn hàng đã kết thúc, không thể hủy.'); return; }
    if (!window.confirm(`Hủy đơn ${code}?`)) return;
    setBusy(true);
    try {
      const cancelled = await commerceApi.cancel(order.id);
      setOrders(current => current.map(entry => entry.id === cancelled.id ? cancelled : entry));
      notify.success('Đã hủy đơn hàng.');
      try { await refreshOrders(); }
      catch { notify.warning('Đơn hàng đã được hủy trên máy chủ, nhưng chưa thể tải lại danh sách. Vui lòng tải lại trang; không cần hủy lại.'); }
    } catch (error) { report(error); } finally { setBusy(false); }
  };
  const handleReviewOrder = async (code: string) => {
    const order = findOrder(code); if (!order || busy) return;
    if (order.status !== 'COMPLETED') { notify.warning('Chỉ có thể đánh giá đơn đã hoàn tất.'); return; }
    if (!window.confirm(`Gửi đánh giá 5 sao cho người bán của đơn ${code}?`)) return;
    setBusy(true);
    try { await commerceApi.rateSeller(order.id, order.sellerId, 5); notify.success('Đã gửi đánh giá người bán.'); } catch (error) { report(error); } finally { setBusy(false); }
  };
  const handleRebuy = async (code: string) => {
    const order = findOrder(code); if (!order || busy) return;
    setBusy(true);
    let added = 0;
    try {
      // Fetch current catalog prices rather than reusing a historical order price.
      for (const item of order.items) {
        if (item.skuId) throw new Error("Mua lại biến thể chưa được hỗ trợ. Vui lòng mở sản phẩm và chọn lại biến thể theo giá hiện tại.");
        const product = await buyerApi.product(item.productId);
        if (product.status !== 'ACTIVE' || product.basePrice <= 0) throw new Error('Sản phẩm không còn được bán hoặc chưa có giá mua hợp lệ.');
        await commerceApi.add({ productId: product.id, sellerId: product.sellerId, productName: product.name, unitPrice: Number(product.basePrice), quantity: item.quantity });
        added++;
      }
      window.dispatchEvent(new Event('nexus:cart-changed'));
      notify.success('Đã thêm sản phẩm vào giỏ hàng theo giá hiện tại.'); navigate('/cart');
    } catch (error) { if (added) window.dispatchEvent(new Event('nexus:cart-changed')); if (added) notify.info(`${added} sản phẩm đã được thêm. Các mục còn lại chưa được thêm.`); report(error); } finally { setBusy(false); }
  };
  const handleOpenC2c = () => { setActiveTab('c2c'); window.scrollTo({ top: 400, behavior: 'smooth' }); };
  const handleC2cDraftChange = <K extends keyof C2cDraft>(field: K, value: C2cDraft[K]) => setC2cDraft(current => ({ ...current, [field]: value }));
  return {
    loading, loadError, buyerProfile, orderCounts: Object.fromEntries(["all", "shipping", "completed", "cancelled"].map(status => [status, status === "all" ? orders.length : orders.filter(order => order.status.toLowerCase() === status).length])), orderCount: orders.length, savedCount: 0, activeTab, setActiveTab, auctionFilter, orderFilter,
    auctionSearch, setAuctionSearch, bids, visibleBids: bids, visibleOrders, winRemaining: 0, items, selectedItemCount: 0, savedSubtotal: 0, c2cDraft,
    handleOpenC2c, handleBidAction: (_bid: BuyerBid) => unavailable(), handleBidHistory: (_label: string) => unavailable(),
    handleSelectAuctionFilter: setAuctionFilter, handleSelectOrderFilter: setOrderFilter,
    handlePayment: unavailable, handleWinDetail: unavailable, handleTrackShipment, handleCancelOrder, handleReviewOrder, handleRebuy,
    handleToggleItem: (_id: string) => unavailable(), handleSelectAllItems: unavailable, handleQuantityChange: (_id: string, _quantity: number) => unavailable(),
    handleRemoveItem: (_id: string) => unavailable(), handleMoveToCart: (_id: string) => unavailable(), handleCheckoutSelected: unavailable,
    handleC2cViewBidders: (_count: number) => unavailable(), handleC2cEndEarly: unavailable, handleC2cDraftChange,
    handleC2cReset: () => setC2cDraft(initialDraft), handleC2cSubmit: unavailable, handleLiveFeedAction: unavailable,
    handleGuaranteeLink: unavailable, handleComplaint: unavailable, handleSupportChat: unavailable,
  };
}
export type UseBuyerHub = ReturnType<typeof useBuyerHub>;
export function resolveBidStatusLabel(status: BidStatus): string {
  if (status === 'outbid') return 'Bị vượt giá';
  if (status === 'leading') return 'Bạn đang dẫn đầu';
  if (status === 'won') return 'Thắng thầu';
  return 'Đã kết thúc (Thua thầu)';
}
export function matchesAuctionFilter(status: BidStatus, filter: AuctionFilterId): boolean { return filter === 'all' || status === filter; }
