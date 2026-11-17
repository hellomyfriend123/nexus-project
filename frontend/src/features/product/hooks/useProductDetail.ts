import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReviews, getAuction, getBids, placeBid, type CatalogProductDetail, type Auction, type Review, type Bid } from '../../../services/api/catalog';
import { apiErrorMessage, type PageResponse } from '../../../services/api/client';
import { notify } from '../../../shared/components/Toast';
import useAddToCartAnimation from './useAddToCartAnimation';

export function useProductDetail(product: CatalogProductDetail, initialAuction: Auction | null) {
 const navigate = useNavigate(); const [auction, setAuction] = useState(initialAuction);
 const [quantity, setQuantity] = useState(1); const [image, setImage] = useState(0); const [bid, setBid] = useState(initialAuction?.currentPrice ?? product.basePrice);
 const bidLock = useRef(false);
 const [pending, setPending] = useState(false); const [bidRefreshFailed, setBidRefreshFailed] = useState(false); const [notice, setNotice] = useState('');
 const { added, stageRef, imageRef, cartRef, badgeRef, addToCart } = useAddToCartAnimation(() => setNotice('Đã thêm sản phẩm vào giỏ hàng.'));
 const [reviewPage, setReviewPage] = useState(0); const [reviews, setReviews] = useState<PageResponse<Review> | null>(null); const [reviewError, setReviewError] = useState('');
 const [bidPage, setBidPage] = useState(0); const [bids, setBids] = useState<PageResponse<Bid> | null>(null); const [bidError, setBidError] = useState(''); const [refresh, setRefresh] = useState(0);
 const [clock, setClock] = useState(() => Date.now());
 const unsupported = (feature: string) => notify.error(feature + ' chưa được máy chủ hỗ trợ.');
 const images = product.images.length ? product.images : product.primaryImageUrl ? [product.primaryImageUrl] : [];
 useEffect(() => { const timer = window.setInterval(() => setClock(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
 useEffect(() => { const controller = new AbortController(); setReviewError(''); setReviews(null);
  getReviews(product.id, reviewPage, controller.signal).then(setReviews).catch(error => { if (!controller.signal.aborted) { setReviewError(apiErrorMessage(error)); notify.error(apiErrorMessage(error)); } }); return () => controller.abort();
 }, [product.id, reviewPage]);
 useEffect(() => { if (!initialAuction) return; const controller = new AbortController(); setBidError(''); setBids(null);
  getBids(initialAuction.id, bidPage, controller.signal).then(setBids).catch(error => { if (!controller.signal.aborted) { setBidError(apiErrorMessage(error)); notify.error(apiErrorMessage(error)); } }); return () => controller.abort();
 }, [initialAuction, bidPage, refresh]);
 async function submitBid() {
  if (!auction || bidLock.current || bidRefreshFailed) return;
  if (!Number.isFinite(bid) || bid <= auction.currentPrice) { notify.error('Giá đặt phải lớn hơn giá hiện tại.'); return; }
  bidLock.current = true; setPending(true);
  try {
   await placeBid(auction.id, bid);
   setNotice('Giá thầu đã được máy chủ ghi nhận.'); notify.success('Đặt giá thành công.');
   setBidPage(0); setRefresh(value => value + 1);
   try { const updated = await getAuction(auction.id); setAuction(updated); setBid(updated.currentPrice); }
   catch { setBidRefreshFailed(true); const message = 'Giá thầu đã được ghi nhận nhưng tải lại phiên đấu giá thất bại. Vui lòng tải lại trang trước khi đặt tiếp.'; setNotice(message); notify.warning(message); }
  } catch (error) { setNotice(apiErrorMessage(error)); notify.error(apiErrorMessage(error)); }
  finally { bidLock.current = false; setPending(false); }
 }
 async function share() { try { await navigator.clipboard.writeText(window.location.href); notify.success('Đã sao chép liên kết sản phẩm.'); } catch { notify.error('Không thể sao chép liên kết.'); } }
 const remaining = auction ? Math.max(0, new Date(auction.endTime).getTime() - clock) : 0;
 const active = auction?.status === 'ACTIVE' && clock >= new Date(auction.startTime).getTime() && remaining > 0;
 return { navigate, auction, quantity, setQuantity, image, setImage, bid, setBid, pending, bidRefreshFailed, notice, added, stageRef, imageRef, cartRef, badgeRef, addToCart, reviewPage, setReviewPage, reviews, reviewError, bidPage, setBidPage, bids, bidError, unsupported, images, submitBid, share, remaining, active };
}
