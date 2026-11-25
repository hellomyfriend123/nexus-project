import type { AuctionResult, Outcome } from '../types/auctionResult';
import { getAuction, getBids } from '../../../services/api/catalog';
import { getAuctionSettlement } from '../../../services/api/auction';
import { getCatalogProduct } from '../../../services/api/catalog';
import { me } from '../../../services/api/auth';
import { commerceApi } from '../../../services/api/commerce';
import { ApiError } from '../../../services/api/client';
export async function getAuctionResult(auctionId: string, outcome: Outcome, signal?: AbortSignal): Promise<AuctionResult> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(auctionId)) throw new ApiError(400, 'Cần mã UUID phiên đấu giá hợp lệ.');
  const [auction, settlement, user] = await Promise.all([getAuction(auctionId, signal), getAuctionSettlement(auctionId, signal), me(signal)]);
  if (auction.status !== 'ENDED' || settlement.status !== 'WON' || !settlement.winnerId || settlement.finalPrice == null) throw new ApiError(409, 'Phiên chưa có kết quả thắng thầu hợp lệ (hoặc không có lượt giá).');
  if (settlement.auctionId !== auction.id || (outcome === 'winner') !== (settlement.winnerId === user.userId)) throw new ApiError(409, 'Trang kết quả không khớp người thắng đã được máy chủ xác nhận.');
  const product = await getCatalogProduct(auction.productId, signal);
  let page = await getBids(auctionId, 0, signal);
  const bids = [...page.content];
  // Read every accepted-bid page: the buyer's best bid may be outside the first page.
  while (!page.last) { const next = await getBids(auctionId, page.page + 1, signal); if (next.page <= page.page) throw new ApiError(200, 'Phân trang lịch sử giá không hợp lệ.'); page = next; bids.push(...page.content); }
  const own = bids.filter(b => b.bidderId === user.userId);
  const order = outcome === 'winner' && settlement.orderId ? await commerceApi.order(settlement.orderId) : null;
  if (order && (order.id !== settlement.orderId || order.orderType !== 'AUCTION' || !['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'].includes(order.status))) throw new ApiError(200, 'Đơn hàng không khớp kết quả đấu giá.');
  return {
    summary: { auctionId, buyer: user.fullName, winningBid: settlement.finalPrice, personalBid: own.length ? Math.max(...own.map(b => b.amount)) : null, marketPrice: product.basePrice, startingPrice: auction.startingPrice, deposit: null, endedAt: new Date(settlement.settledAt).toLocaleString('vi-VN'), paymentSeconds: 0, bidCount: settlement.bidCount },
    product: { id: product.id, title: product.name, image: product.primaryImageUrl ?? product.images[0] ?? '', seller: auction.sellerId, condition: 'Chưa có dữ liệu tình trạng', location: 'Chưa có dữ liệu địa điểm', shipping: 'Chưa có dữ liệu giao hàng' },
    bids: bids.map(b => ({ id: b.id, bidder: b.bidderId, amount: b.amount, time: new Date(b.placedAt).toLocaleString('vi-VN'), own: b.bidderId === user.userId, winner: b.bidderId === settlement.winnerId && b.amount === settlement.finalPrice })),
    recommendations: [],
    settlement: { orderId: settlement.orderId, orderStatus: order?.status, status: settlement.status, winnerId: settlement.winnerId, refundReference: 'Chưa có API', refundedAt: 'Chưa có API', wallet: 'Chưa có API', paymentMethods: [], escrowBenefits: [], steps: [{ title: 'Đã chốt phiên', description: new Date(settlement.settledAt).toLocaleString('vi-VN'), state: 'done' }, { title: 'Đơn hàng', description: order ? `${order.orderNumber} · ${order.status}` : 'Chưa có đơn hàng liên kết', state: order ? 'active' : 'pending' }] },
  };
}
export const formatMoney = (amount: number | null) => amount == null ? 'Chưa có dữ liệu' : new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
