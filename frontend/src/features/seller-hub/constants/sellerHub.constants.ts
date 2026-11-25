// UI configuration preserved from the original consumers.
import type { SellerTab } from '../types/sellerHub';
export const sellerTabs: SellerTab[] = [
  { id: 'products', icon: 'box-seam', label: 'Quản lý Sản phẩm & Tồn kho (CRUD)', badge: '48' },
  { id: 'auctions', icon: 'hammer', label: 'Phiên Đấu Giá (Active Auctions)', badge: '5 Live' },
  { id: 'orders', icon: 'truck', label: 'Đơn Hàng & Vận Chuyển (Fulfillment)', badge: '8' },
  { id: 'reports', icon: 'graph-up-arrow', label: 'Báo cáo & Đánh giá shop', badge: '' },
];

export const formatSellerMoney = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)} đ`;

/* ----- Tab Phiên Đấu Giá ----- */
// TODO(seller-hub): 5 phiên khớp badge "5 Live"; số liệu KPI là copy từ thiết kế, dữ liệu dòng là mock.

export const auctionStates: Record<string, string> = { all: 'Tất cả phiên', live: 'Đang diễn ra', closing: 'Sắp kết thúc' };

/* ----- Tab Đơn Hàng & Vận Chuyển ----- */
// TODO(seller-hub): 8 đơn khớp badge "8"; dữ liệu người mua là mock, không phải thông tin thật.

export const sellerOrderFilters = [
  { id: 'all', label: 'Tất cả', count: 8 }, { id: 'pending', label: 'Chờ duyệt', count: 3 },
  { id: 'packing', label: 'Đang chuẩn bị', count: 2 }, { id: 'shipping', label: 'Đang giao', count: 2 },
  { id: 'done', label: 'Hoàn tất', count: 1 }, { id: 'cancelled', label: 'Đã hủy', count: 0 },
];

export const orderStatusLabels: Record<string, string> = {
  pending: 'Chờ duyệt', packing: 'Đang chuẩn bị', shipping: 'Đang giao', done: 'Hoàn tất', cancelled: 'Đã hủy',
};

/* ----- Tab Báo cáo & Đánh giá shop ----- */
// TODO(seller-hub): Số liệu báo cáo là mock cố định, chưa tính toán từ dữ liệu thật.
