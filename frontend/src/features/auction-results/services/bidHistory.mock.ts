// Legacy UI fixture only. Not used by the live result screen. TODO: remove after visual fixture migration.
import type { Bid } from '../types/auctionResult';
// TODO: Replace mock audit history with an approved REST API integration.
export const bidHistoryMock: Bid[] = [
  { id: 'bid-1', bidder: 'alex_nguyen (Bạn)', amount: 38800000, time: '25/10/2025 23:59:51', winner: true },
  { id: 'bid-2', bidder: 'm****8 (TP. HCM)', amount: 38200000, time: '25/10/2025 23:59:22' },
  { id: 'bid-3', bidder: 'alex_nguyen (Bạn)', amount: 37600000, time: '25/10/2025 23:58:54', own: true },
  { id: 'bid-4', bidder: 'hoang_vu*** (Hà Nội)', amount: 36500000, time: '25/10/2025 23:12:38' },
  { id: 'bid-5', bidder: 'kien_ph*** (Đà Nẵng)', amount: 35000000, time: '25/10/2025 18:04:48' },
  { id: 'bid-6', bidder: 'tran_th***', amount: 30000000, time: '24/10/2025 10:00:06' },
];
export const losingBidHistoryMock: Bid[] = [
  { id: 'lost-1', bidder: 'alex_ng*** · THẮNG CUỘC', amount: 38800000, time: '23:59:51 · Đấu giá tự động', winner: true },
  { id: 'lost-2', bidder: 'Bạn (Alex) · LƯỢT GIÁ CAO NHẤT', amount: 38200000, time: '23:59:22 · Giá gửi trực tiếp', own: true },
  { id: 'lost-3', bidder: 'minh_camera***', amount: 37700000, time: '23:58:40 · Giá gửi trực tiếp' },
  { id: 'lost-4', bidder: 'trangngoc_photo***', amount: 37200000, time: '23:58:15 · Giá gửi trực tiếp' },
];
