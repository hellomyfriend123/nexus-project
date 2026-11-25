import { api, ApiError } from './client';
import { adaptAuction, adaptApiPage, adaptBid, getCatalogProduct } from './catalog';
interface Settlement { auctionId: string; winnerId: string | null; orderId: string | null; finalPrice: number | null; status: 'WON' | 'NO_BIDS' | 'FAILED'; settledAt: string; bidCount: number }
function invalid(): never { throw new ApiError(200, 'Dữ liệu kết quả đấu giá từ máy chủ không hợp lệ.'); }
function settlementDto(value: unknown, id: string): Settlement {
 if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
 const v = value as Record<string, unknown>;
 const optionalId = (value: unknown) => value == null || (typeof value === 'string' && value.length > 0);
 if (v.auctionId !== id || !['WON', 'NO_BIDS', 'FAILED'].includes(String(v.status)) || !optionalId(v.winnerId) || !optionalId(v.orderId) || (v.finalPrice != null && (typeof v.finalPrice !== 'number' || !Number.isFinite(v.finalPrice) || v.finalPrice < 0)) || typeof v.settledAt !== 'string' || !Number.isFinite(Date.parse(v.settledAt)) || !Number.isSafeInteger(v.bidCount) || Number(v.bidCount) < 0) return invalid();
 if (v.status === 'WON' && (!v.winnerId || v.finalPrice == null)) return invalid();
 return { auctionId: id, winnerId: v.winnerId == null ? null : String(v.winnerId), orderId: v.orderId == null ? null : String(v.orderId), finalPrice: v.finalPrice == null ? null : Number(v.finalPrice), status: v.status as Settlement['status'], settledAt: v.settledAt, bidCount: Number(v.bidCount) };
}
const path = (id: string) => '/api/v1/auction/auctions/' + encodeURIComponent(id);
export const getAuctionResultBids = async (id: string, page = 0, signal?: AbortSignal) => adaptApiPage(await api(path(id) + '/bids?page=' + page + '&size=10', { signal }), value => {
    if (!value || typeof value !== 'object' || (value as Record<string, unknown>).auctionId !== id) return invalid();
    return adaptBid(value);
  });
export async function loadAuctionResultData(id: string, sellerId: string, signal?: AbortSignal) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new ApiError(400, 'Mã phiên đấu giá không hợp lệ.');
    const auction = adaptAuction(await api(path(id), { signal }));
    if (auction.id !== id || auction.acceptedBidCount == null) return invalid();
    if (auction.sellerId !== sellerId) throw new ApiError(403, 'Phiên đấu giá không thuộc tài khoản người bán này.');
    const [product, settlement, bids] = await Promise.all([
      getCatalogProduct(auction.productId, signal),
      api(path(id) + '/settlement', { signal }).then(value => settlementDto(value, id)).catch(error => { if (error instanceof ApiError && error.status === 404) return null; throw error; }),
      getAuctionResultBids(id, 0, signal),
    ]);
    const order = settlement?.orderId ? await api<{ id: string; orderType: string; status: string; receiverName: string | null; receiverPhone: string | null; shippingAddress: string | null; shippingFee: number; items: { productId: string; skuCodeSnapshot: string | null; quantity: number }[] }>('/api/v1/seller/commerce/orders/' + encodeURIComponent(settlement.orderId), { signal }) : null;
    if (product.id !== auction.productId || product.sellerId !== auction.sellerId) return invalid();
    if (order && (order.id !== settlement?.orderId || order.orderType !== 'AUCTION' || !Array.isArray(order.items) || typeof order.status !== 'string' || typeof order.shippingFee !== 'number' || !Number.isFinite(order.shippingFee) || order.shippingFee < 0)) return invalid();
    return { auction: { ...auction, acceptedBidCount: auction.acceptedBidCount }, product, settlement, bids, order };
}
