import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiErrorMessage } from '../../../services/api/client';
import { commerceApi, type CommerceOrder, type CommerceOrderSummary } from '../../../services/api/commerce';
import { resolveProductImages } from '../../../services/api/catalog';
import { buyerApi, type BuyerProfileResponse } from '../../../services/api/buyer';
import { getSession } from '../../../services/api/auth';
import { notify } from '../../../shared/components/Toast';

export const orderStatusLabels: Record<string, string> = {
  PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', SHIPPING: 'Đang giao', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy',
};
export function useBuyerHub() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sessionToken, setSessionToken] = useState(() => getSession()?.accessToken ?? null);
  const tokenRef = useRef(sessionToken);
  const mounted = useRef(true);
  const [profile, setProfile] = useState<BuyerProfileResponse | null>(null);
  const [profileError, setProfileError] = useState('');
  const [orders, setOrders] = useState<CommerceOrderSummary[]>([]);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const actionLock = useRef(false);
  const [selectedId, setSelectedId] = useState<string | null>(() => searchParams.get('orderId'));
  const [orderDetail, setOrderDetail] = useState<CommerceOrder | null>(null);
  const [detailError, setDetailError] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  // productId -> catalog image URL (or null when the product is gone / has no image).
  const [detailImages, setDetailImages] = useState<Map<string, string | null>>(new Map());
  const [shipments, setShipments] = useState<Awaited<ReturnType<typeof buyerApi.shipments>>>([]);
  const [shipmentError, setShipmentError] = useState('');
  const [reviewOrder, setReviewOrder] = useState<CommerceOrderSummary | null>(null);
  const [reviewError, setReviewError] = useState('');
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(() => new Set());
  const queryOrderId = searchParams.get('orderId');
  useEffect(() => { setSelectedId(queryOrderId); }, [queryOrderId]);
  useEffect(() => {
    mounted.current = true;
    const syncSession = () => {
      const token = getSession()?.accessToken ?? null;
      if (token === tokenRef.current) return;
      tokenRef.current = token;
      setSessionToken(token);
      setProfile(null); setProfileError(''); setOrders([]); setTotal(0); setTotalPages(0);
      setPage(0); setStatus(''); setLoading(Boolean(token)); setLoadError('');
      setSelectedId(null); setOrderDetail(null); setDetailError(''); setDetailLoading(false); setDetailImages(new Map());
      setShipments([]); setShipmentError(''); setReviewOrder(null); setReviewError(''); setReviewedIds(new Set());
      actionLock.current = false; setBusy(false);
    };
    window.addEventListener('nexus:session-changed', syncSession);
    window.addEventListener('storage', syncSession);
    syncSession();
    return () => {
      mounted.current = false;
      window.removeEventListener('nexus:session-changed', syncSession);
      window.removeEventListener('storage', syncSession);
    };
  }, []);
  const isCurrentSession = useCallback(() => mounted.current && Boolean(sessionToken) && getSession()?.accessToken === sessionToken, [sessionToken]);
  useEffect(() => {
    if (!sessionToken) return;
    let active = true;
    buyerApi.profile().then(value => { if (active && isCurrentSession()) setProfile(value); }).catch(error => { if (active && isCurrentSession()) setProfileError(apiErrorMessage(error)); });
    return () => { active = false; };
  }, [sessionToken, isCurrentSession]);
  useEffect(() => {
    if (!sessionToken) return;
    let active = true;
    setLoading(true); setLoadError('');
    commerceApi.orders(page, status || undefined).then(result => {
      if (!active || !isCurrentSession()) return;
      if (page > 0 && page >= result.totalPages) { setPage(Math.max(0, result.totalPages - 1)); return; }
      setOrders(result.content); setTotal(result.totalElements); setTotalPages(result.totalPages);
    }).catch(error => { if (active && isCurrentSession()) setLoadError(apiErrorMessage(error)); }).finally(() => { if (active && isCurrentSession()) setLoading(false); });
    return () => { active = false; };
  }, [page, status, revision, sessionToken, isCurrentSession]);
  useEffect(() => {
    if (!selectedId || !sessionToken) return;
    let active = true;
    setOrderDetail(null); setDetailError(''); setDetailLoading(true); setShipments([]); setShipmentError(''); setDetailImages(new Map());
    Promise.all([
      commerceApi.order(selectedId).then(async value => {
        if (!active || !isCurrentSession()) return;
        setOrderDetail(value);
        // Order DTOs carry no image; the only source is the public catalog, keyed by productId and
        // cached per product so repeated items or a reopened order do not refetch.
        const images = await resolveProductImages(value.items.map(item => item.productId));
        if (active && isCurrentSession()) setDetailImages(images);
      }).catch(error => { if (active && isCurrentSession()) setDetailError(apiErrorMessage(error)); }),
      buyerApi.shipments(selectedId).then(value => { if (active && isCurrentSession()) setShipments(value); }).catch(error => { if (active && isCurrentSession()) setShipmentError(apiErrorMessage(error)); }),
    ]).finally(() => { if (active && isCurrentSession()) setDetailLoading(false); });
    return () => { active = false; };
  }, [selectedId, sessionToken, isCurrentSession]);
  const run = async (action: () => Promise<void>) => {
    if (actionLock.current || !isCurrentSession()) return;
    actionLock.current = true; setBusy(true);
    try { await action(); } catch (error) { if (isCurrentSession()) notify.error(apiErrorMessage(error)); }
    finally { if (isCurrentSession()) { actionLock.current = false; setBusy(false); } }
  };
  const cancelOrder = (order: CommerceOrderSummary) => {
    if (['COMPLETED', 'CANCELLED'].includes(order.status) || actionLock.current) return;
    if (!window.confirm('Hủy đơn ' + order.orderNumber + '?')) return;
    void run(async () => {
      const cancelled = await commerceApi.cancel(order.id);
      if (!isCurrentSession()) return;
      setOrders(current => current.map(item => item.id === cancelled.id ? { ...item, status: cancelled.status } : item));
      setOrderDetail(current => current?.id === cancelled.id ? cancelled : current);
      setRevision(value => value + 1); notify.success('Đã hủy đơn hàng.');
    });
  };
  const rebuy = (summary: CommerceOrderSummary) => void run(async () => {
    const order = await commerceApi.order(summary.id);
    if (!isCurrentSession()) return;
    let added = 0;
    try {
      for (const item of order.items) {
        if (item.skuId) throw new Error('Vui lòng mở sản phẩm để chọn lại biến thể theo giá hiện tại.');
        const product = await buyerApi.product(item.productId);
        if (!isCurrentSession()) return;
        if (product.status !== 'ACTIVE' || product.basePrice <= 0) throw new Error('Sản phẩm không còn được bán.');
        await commerceApi.add({ productId: product.id, sellerId: product.sellerId, productName: product.name, unitPrice: Number(product.basePrice), quantity: item.quantity });
        if (!isCurrentSession()) return;
        added++;
      }
      if (added) { notify.success('Đã thêm sản phẩm vào giỏ theo giá hiện tại.'); navigate('/cart'); }
    } catch (error) {
      if (added && isCurrentSession()) notify.info(added + ' sản phẩm đã được thêm; các sản phẩm còn lại chưa được thêm.');
      throw error;
    } finally { if (added && isCurrentSession()) window.dispatchEvent(new Event('nexus:cart-changed')); }
  });
  const submitReview = async (score: number, comment: string) => {
    if (!reviewOrder || reviewOrder.status !== 'COMPLETED' || actionLock.current || !isCurrentSession()) return;
    if (!Number.isInteger(score) || score < 1 || score > 5 || comment.length > 2000) { setReviewError('Chọn từ 1 đến 5 sao và nhận xét tối đa 2.000 ký tự.'); return; }
    actionLock.current = true; setBusy(true); setReviewError('');
    try {
      await commerceApi.rateSeller(reviewOrder.id, reviewOrder.sellerId, score, comment);
      if (!isCurrentSession()) return;
      setReviewedIds(current => new Set([...current, reviewOrder.id]));
      setReviewOrder(null); notify.success('Đã gửi đánh giá người bán.');
    } catch (error) { if (isCurrentSession()) setReviewError(apiErrorMessage(error)); }
    finally { if (isCurrentSession()) { actionLock.current = false; setBusy(false); } }
  };
  return {
    signedIn: Boolean(sessionToken), profile, profileError, orders, status, page, totalPages, total, loading, loadError, busy,
    setPage, selectStatus: (value: string) => { setPage(0); setStatus(value); }, retry: () => setRevision(value => value + 1),
    selectedId, orderDetail, detailError, detailLoading, detailImages, shipments, shipmentError, openDetail: setSelectedId, closeDetail: () => setSelectedId(null),
    cancelOrder, rebuy, reviewOrder, reviewError, reviewedIds, submitReview,
    openReview: (order: CommerceOrderSummary) => { setReviewError(''); setReviewOrder(order); },
    closeReview: () => { if (!actionLock.current) setReviewOrder(null); },
  };
}
export type UseBuyerHub = ReturnType<typeof useBuyerHub>;

