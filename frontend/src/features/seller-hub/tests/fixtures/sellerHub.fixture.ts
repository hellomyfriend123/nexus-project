import type {
  ListingDraft, RevenuePoint, SellerAuction, SellerKpi, SellerNotice, SellerOrder, SellerProduct, SellerTab, ShopRating, ShopReview, TopSku,
} from '../../types/sellerHub';
import lens from '../../../../assets/images/seller-inventory/product-1.jpg';
import laptop from '../../../../assets/images/seller-hub/laptop.jpg';
import keyboard from '../../../../assets/images/seller-hub/keyboard.jpg';
import camera from '../../../../assets/images/seller-hub/camera.jpg';
import headphones from '../../../../assets/images/seller-hub/headphones.jpg';

// TODO(seller-hub): Replace mock data only when a separate API integration task is approved.
export const initialProducts: SellerProduct[] = [
  { id: '1', name: 'Dell XPS 15 9530', sku: 'DELL-XPS-15', category: 'Laptop & PC', image: laptop, stock: 12, sold: 18, status: 'ready', price: 38000000, note: 'Giá đề xuất: 39.5M' },
  { id: '2', name: 'Bàn phím cơ Leopold FC900R', sku: 'LEO-900R', category: 'Phụ kiện Máy tính', image: keyboard, stock: 4, status: 'low', price: 2900000, note: 'Biên lợi nhuận 24%' },
  { id: '3', name: 'Máy ảnh Canon EOS R6', sku: 'AUC-9941', category: 'Máy ảnh & Quang học', image: camera, stock: 1, status: 'auction', price: 52400000, note: 'Khởi điểm: 45.000.000 đ', bids: 9 },
  { id: '4', name: 'Tai nghe chống ồn Sony WH-5', sku: 'SONY-WH5-SLV', category: 'Âm thanh & Tai nghe', image: headphones, stock: 24, sold: 45, status: 'available', price: 6790000, note: 'Đã áp voucher sàn' },
];
export const initialDraft: ListingDraft = { name: '', category: 'Đồ điện tử & Công nghệ', price: '', stock: '10', buyNow: true, makeOffer: false };
export const sellerTabs: SellerTab[] = [
  { id: 'products', icon: 'box-seam', label: 'Quản lý Sản phẩm & Tồn kho (CRUD)', badge: '48' },
  { id: 'auctions', icon: 'hammer', label: 'Phiên Đấu Giá (Active Auctions)', badge: '5 Live' },
  { id: 'orders', icon: 'truck', label: 'Đơn Hàng & Vận Chuyển (Fulfillment)', badge: '8' },
  { id: 'reports', icon: 'graph-up-arrow', label: 'Báo cáo & Đánh giá shop', badge: '' },
];
export const sellerKpis: SellerKpi[] = [
  { label: 'Doanh thu tháng (T3/2025)', value: '142.500.000 đ', unit: '', caption: '+18.4% so với tháng trước', icon: 'cash-stack', tone: 'primary' },
  { label: 'Đơn hàng mới chờ duyệt', value: '8', unit: 'đơn', caption: '3 đơn giao gấp Hỏa Tốc', icon: 'bag-check', tone: 'primary' },
  { label: 'Phiên đấu giá đang chạy', value: '5', unit: 'phiên', caption: '32 lượt bids phát sinh', icon: 'hammer', tone: 'danger' },
  { label: 'Sản phẩm cảnh báo tồn ít', value: '2', unit: 'SKU', caption: 'Dưới ngưỡng tối thiểu 5', icon: 'archive', tone: 'danger' },
];
export const sellerNotices: SellerNotice[] = [
  { id: 'order', icon: 'receipt', tone: 'primary', title: 'Đơn hàng mới #NX-8821 đã thanh toán', body: 'Khách hàng Nguyễn V. vừa hoàn tất thanh toán 38.000.000 đ cho...', time: '5 phút trước' },
  { id: 'bid', icon: 'hammer', tone: 'danger', title: 'Canon EOS R6 có lượt đấu mới!', body: 'User bidder_viet99 vừa đặt mức thầu mới: 52.400.000 đ (+1.4M)...', time: '12 phút trước' },
  { id: 'sold', icon: 'patch-check', tone: 'neutral', title: 'Sản phẩm NIK-50-AIS đã bán đứt', body: 'Ống kính Nikkor 50mm f/1.2 AIS được kích hoạt tùy chọn “Mua...”', time: '42 phút trước' },
  { id: 'stock', icon: 'archive', tone: 'danger', title: 'Cảnh báo kho: SKU LEO-900R', body: 'Tồn kho khả dụng giảm còn 4 chiếc. Dự kiến cạn kiệt trong 48...', time: '1 giờ trước' },
];
export const formatSellerMoney = (value: number) => `${new Intl.NumberFormat('vi-VN').format(value)} đ`;

/* ----- Tab Phiên Đấu Giá ----- */
// TODO(seller-hub): 5 phiên khớp badge "5 Live"; số liệu KPI là copy từ thiết kế, dữ liệu dòng là mock.
export const sellerAuctionKpis = [
  { label: 'Phiên đang chạy', value: '5', unit: 'phiên', caption: '1 phiên sắp kết thúc', icon: 'hammer', tone: 'danger' },
  { label: 'Lượt bid phát sinh', value: '32', unit: 'lượt', caption: '+7 lượt trong 1 giờ', icon: 'arrow-up-right', tone: 'primary' },
  { label: 'Tổng giá trị bid hiện tại', value: '96.800.000 đ', unit: '', caption: 'Giá khởi điểm 72.000.000 đ', icon: 'cash-stack', tone: 'primary' },
];
export const sellerAuctions: SellerAuction[] = [
  { id: 'auc-982', roomCode: '#AUCT-982', product: 'Máy ảnh Canon EOS R6 Mark II Body', sku: 'AUC-9941', image: camera, currentBid: 52400000, startPrice: 45000000, bids: 9, watchers: '42 người quan tâm', endsIn: 'Còn 03h 12m', state: 'live', topBidder: 'bidder_viet99' },
  { id: 'auc-981', roomCode: '#AUCT-981', product: 'Ống kính Sony FE 24-70mm f/2.8 GM II', sku: 'LENS-SONY-2470', image: lens, currentBid: 28500000, startPrice: 15000000, bids: 12, watchers: '86 người quan tâm', endsIn: 'Còn 00h 18m', state: 'closing', topBidder: 'photo_hunter' },
  { id: 'auc-980', roomCode: '#AUCT-980', product: 'Dell XPS 15 9530 Touch 4K OLED', sku: 'DELL-XPS-15', image: laptop, currentBid: 8900000, startPrice: 6800000, bids: 4, watchers: '21 người quan tâm', endsIn: 'Còn 1 ngày 04h', state: 'live', topBidder: 'laptop_lover' },
  { id: 'auc-979', roomCode: '#AUCT-979', product: 'Bàn phím cơ Leopold FC900R Navy', sku: 'LEO-900R', image: keyboard, currentBid: 3800000, startPrice: 2900000, bids: 5, watchers: '18 người quan tâm', endsIn: 'Còn 2 ngày 09h', state: 'live', topBidder: 'keycap_vn' },
  { id: 'auc-978', roomCode: '#AUCT-978', product: 'Tai nghe chống ồn Sony WH-5 Bạc', sku: 'SONY-WH5-SLV', image: headphones, currentBid: 2700000, startPrice: 2400000, bids: 2, watchers: '9 người quan tâm', endsIn: 'Còn 3 ngày 02h', state: 'live', topBidder: 'sound_care' },
];
export const auctionStates: Record<string, string> = { all: 'Tất cả phiên', live: 'Đang diễn ra', closing: 'Sắp kết thúc' };

/* ----- Tab Đơn Hàng & Vận Chuyển ----- */
// TODO(seller-hub): 8 đơn khớp badge "8"; dữ liệu người mua là mock, không phải thông tin thật.
export const sellerOrderFilters = [
  { id: 'all', label: 'Tất cả', count: 8 }, { id: 'pending', label: 'Chờ duyệt', count: 3 },
  { id: 'packing', label: 'Đang chuẩn bị', count: 2 }, { id: 'shipping', label: 'Đang giao', count: 2 },
  { id: 'done', label: 'Hoàn tất', count: 1 }, { id: 'cancelled', label: 'Đã hủy', count: 0 },
];
export const sellerOrders: SellerOrder[] = [
  { id: 'o-8821', code: '#NX-8821', buyer: 'Nguyễn Văn An', contact: '09••• 214', items: 'Dell XPS 15 9530', itemCount: '1 sản phẩm', total: 38000000, method: 'Hỏa Tốc 2h', express: true, status: 'pending', placedAt: 'Hôm nay, 09:42', deadline: 'Xác nhận trước 10:42' },
  { id: 'o-8820', code: '#NX-8820', buyer: 'Trần Minh Hằng', contact: '08••• 907', items: 'Canon EOS R6 Mark II', itemCount: '1 sản phẩm', total: 52400000, method: 'Hỏa Tốc 2h', express: true, status: 'pending', placedAt: 'Hôm nay, 08:15', deadline: 'Xác nhận trước 09:15' },
  { id: 'o-8819', code: '#NX-8819', buyer: 'Lê Quốc Bảo', contact: '03••• 441', items: 'Sony WH-5 + Phụ kiện', itemCount: '2 sản phẩm', total: 7190000, method: 'Hỏa Tốc 2h', express: true, status: 'pending', placedAt: 'Hôm nay, 07:58', deadline: 'Xác nhận trước 08:58' },
  { id: 'o-8818', code: '#NX-8818', buyer: 'Phạm Thu Trang', contact: '09••• 118', items: 'Leopold FC900R Navy', itemCount: '1 sản phẩm', total: 2900000, method: 'Giao tiêu chuẩn', express: false, status: 'packing', placedAt: 'Hôm qua, 21:04', deadline: 'Đóng gói trước 18:00' },
  { id: 'o-8817', code: '#NX-8817', buyer: 'Đỗ Hoàng Nam', contact: '07••• 632', items: 'Ống kính RF 70-200mm', itemCount: '1 sản phẩm', total: 48000000, method: 'Giao tiêu chuẩn', express: false, status: 'packing', placedAt: 'Hôm qua, 17:36', deadline: 'Đóng gói trước 18:00' },
  { id: 'o-8816', code: '#NX-8816', buyer: 'Vũ Khánh Linh', contact: '09••• 550', items: 'Tai nghe Sony WH-5', itemCount: '1 sản phẩm', total: 6790000, method: 'Giao tiêu chuẩn', express: false, status: 'shipping', placedAt: '12/03, 14:20', deadline: 'Dự kiến giao 15/03' },
  { id: 'o-8815', code: '#NX-8815', buyer: 'Bùi Anh Tuấn', contact: '03••• 276', items: 'Bàn phím Leopold FC980C', itemCount: '1 sản phẩm', total: 4200000, method: 'Giao tiêu chuẩn', express: false, status: 'shipping', placedAt: '12/03, 10:02', deadline: 'Dự kiến giao 14/03' },
  { id: 'o-8814', code: '#NX-8814', buyer: 'Hoàng Diệu', contact: '08••• 733', items: 'Dell XPS 15 9530', itemCount: '1 sản phẩm', total: 38000000, method: 'Giao tiêu chuẩn', express: false, status: 'done', placedAt: '11/03, 16:45', deadline: 'Đã giao 13/03' },
];
export const orderStatusLabels: Record<string, string> = {
  pending: 'Chờ duyệt', packing: 'Đang chuẩn bị', shipping: 'Đang giao', done: 'Hoàn tất', cancelled: 'Đã hủy',
};

/* ----- Tab Báo cáo & Đánh giá shop ----- */
// TODO(seller-hub): Số liệu báo cáo là mock cố định, chưa tính toán từ dữ liệu thật.
export const sellerReportKpis = [
  { label: 'Doanh thu 6 tháng', value: '612.400.000 đ', unit: '', caption: '+18.4% so với cùng kỳ', icon: 'cash-stack', tone: 'primary' },
  { label: 'Tỷ lệ hoàn thành đơn', value: '99.4', unit: '%', caption: '156/157 đơn giao thành công', icon: 'bag-check', tone: 'primary' },
  { label: 'Điểm đánh giá shop', value: '4.8', unit: '/5', caption: '238 đánh giá đã xác thực', icon: 'star', tone: 'danger' },
];
export const sellerRevenueSeries: RevenuePoint[] = [
  { label: 'T10', value: 78000000, growth: '+6.2%' },
  { label: 'T11', value: 92500000, growth: '+18.6%' },
  { label: 'T12', value: 118000000, growth: '+27.6%' },
  { label: 'T1', value: 104500000, growth: '-11.4%' },
  { label: 'T2', value: 120400000, growth: '+15.2%' },
  { label: 'T3', value: 142500000, growth: '+18.4%' },
];
export const sellerTopSkus: TopSku[] = [
  { id: 't1', name: 'Dell XPS 15 9530', sku: 'DELL-XPS-15', sold: '18 máy', revenue: 684000000, trend: '+12%', tone: 'up' },
  { id: 't2', name: 'Tai nghe chống ồn Sony WH-5', sku: 'SONY-WH5-SLV', sold: '45 chiếc', revenue: 305550000, trend: '+9%', tone: 'up' },
  { id: 't3', name: 'Bàn phím cơ Leopold FC900R', sku: 'LEO-900R', sold: '31 chiếc', revenue: 89900000, trend: '+4%', tone: 'up' },
  { id: 't4', name: 'Máy ảnh Canon EOS R6 Mark II', sku: 'CAM-CANON-R6M2', sold: '4 máy', revenue: 209600000, trend: '-2%', tone: 'down' },
];
export const shopRating: ShopRating = {
  score: '4.8', total: '238 đánh giá',
  stars: [{ star: 5, percent: 84 }, { star: 4, percent: 11 }, { star: 3, percent: 3 }, { star: 2, percent: 1 }, { star: 1, percent: 1 }],
};
export const sellerReviews: ShopReview[] = [
  { id: 'rv-1', buyer: 'Nguyễn Văn An', rating: 5, time: '2 giờ trước', product: 'Dell XPS 15 9530', text: 'Máy nguyên seal, shop đóng gói kỹ và giao hỏa tốc đúng 2 giờ. Rất đáng tin cậy.', replied: false },
  { id: 'rv-2', buyer: 'Trần Minh Hằng', rating: 5, time: 'Hôm qua', product: 'Canon EOS R6 Mark II', text: 'Ảnh thực tế đúng mô tả, serial khớp với giấy tờ. Shop tư vấn nhiệt tình.', replied: true },
  { id: 'rv-3', buyer: 'Lê Quốc Bảo', rating: 4, time: '3 ngày trước', product: 'Sony WH-5', text: 'Tai nghe tốt, hộp hơi móp góc nhưng shop đã giảm giá bù. Hài lòng.', replied: false },
];
export const sellerReviewKpis = { replyRate: '96.2%', replyNote: 'Phản hồi trong 5 phút', responseNote: '12 đánh giá chờ phản hồi' };
