// TODO: Result DTOs do not expose payment deadlines, payout/fees, bidder profiles, protection policies or second-chance offers.
import { getAuctionResultBids, loadAuctionResultData } from '../../../services/api/auctionResult';
import type { AuctionResult } from '../types/auctionResult';
interface Bid { id: string; bidderId: string; amount: number; placedAt: string }
const unavailable = 'Chưa có dữ liệu từ máy chủ';
const money = (value: number | null) => value == null ? unavailable : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
const date = (value: string) => new Date(value).toLocaleString('vi-VN');
export const auctionResultService = {
  bids: getAuctionResultBids,
  async getResult(id: string, sellerId: string, signal?: AbortSignal): Promise<AuctionResult> {
    const { auction, product, settlement, bids, order } = await loadAuctionResultData(id, sellerId, signal);
    const orderItem = order?.items.find(item => item.productId === auction.productId);
    const winnerId = settlement?.winnerId ?? null;
    const status = settlement?.status ?? auction.status;
    const title = settlement?.status === 'WON' ? 'Phiên đấu giá đã chốt' : settlement?.status === 'NO_BIDS' ? 'Không có lượt trả giá hợp lệ' : settlement?.status === 'FAILED' ? 'Giao dịch không thành công' : 'Chưa có kết quả chốt phiên';
    return {
      id: auction.id, endedAt: date(settlement?.settledAt ?? auction.endTime), title, subtitle: status,
      paymentStatus: order ? 'Trạng thái đơn hàng: ' + order.status + ' (không phải trạng thái thanh toán)' : 'Chưa có đơn hàng liên kết. API kết quả không cung cấp trạng thái thanh toán.', winningBid: money(settlement?.finalPrice ?? null), startingPrice: money(auction.startingPrice),
      bidCount: settlement?.bidCount ?? auction.acceptedBidCount, bidderCount: null, fee: unavailable, shipping: order ? money(order.shippingFee) : unavailable, net: unavailable,
      metrics: [ { label: 'Giá chốt phiên', value: money(settlement?.finalPrice ?? null), caption: 'Theo kết quả chốt phiên' }, { label: 'Giá khởi điểm', value: money(auction.startingPrice), caption: 'Theo cấu hình phiên' }, { label: 'Lượt trả giá hợp lệ', value: String(settlement?.bidCount ?? auction.acceptedBidCount), caption: 'Dữ liệu máy chủ' }, { label: 'Thực nhận', value: unavailable, caption: 'Chưa có dữ liệu phí / giải ngân' } ],
      winner: { name: order?.receiverName ?? winnerId ?? 'Chưa có người thắng', username: winnerId ?? '—', initials: winnerId ? winnerId.slice(0, 2).toUpperCase() : '—', rating: unavailable, reviews: null, badge: '', phone: order?.receiverPhone ?? unavailable, verification: 'Chưa có dữ liệu xác minh' },
      address: order?.shippingAddress ?? unavailable, privacyNotice: 'Hồ sơ và đánh giá người thắng chưa được cung cấp; thông tin giao hàng chỉ hiển thị khi có đơn hàng liên kết.', packingNotice: 'Chưa thể xác nhận giao hàng từ kết quả phiên đấu giá.',
      product: { name: product.name, image: product.primaryImageUrl ?? '', category: product.categoryName ?? unavailable, condition: unavailable, sku: orderItem?.skuCodeSnapshot ?? unavailable, quantity: orderItem ? String(orderItem.quantity) : unavailable },
      countdown: unavailable, paymentWindow: unavailable, deadline: unavailable,
      steps: [{ icon: 'flag', title: 'Kết quả chốt phiên', description: title, time: settlement ? date(settlement.settledAt) : 'Chưa chốt', state: status, style: settlement ? 'done' : 'pending' }, { icon: 'credit-card', title: 'Thanh toán và giao hàng', description: 'API kết quả chưa cung cấp tiến độ giao dịch.', time: unavailable, state: 'Chưa có dữ liệu', style: 'pending' }],
      bids: bids.content.map(bid => ({ id: bid.id, name: bid.bidderId, initials: bid.bidderId.slice(0, 2).toUpperCase(), amount: money(bid.amount), time: date(bid.placedAt), winner: bid.bidderId === winnerId })),
      bidPage: bids.page, bidTotalPages: bids.totalPages,
      protection: [{ icon: 'info-circle', title: 'Thông tin chính sách', description: 'Máy chủ chưa cung cấp chính sách bảo vệ người bán cho phiên này.' }],
      secondChance: { icon: 'info-circle', title: 'Second Chance', description: 'Chưa có API hỗ trợ tính năng này.' },
    };
  },
  formatBid(bid: Bid, winnerId: string) { return { id: bid.id, name: bid.bidderId, initials: bid.bidderId.slice(0, 2).toUpperCase(), amount: money(bid.amount), time: date(bid.placedAt), winner: bid.bidderId === winnerId }; },
};
