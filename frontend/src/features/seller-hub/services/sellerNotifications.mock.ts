// Preserved design fixtures; live API data is not replaced by these values.
import type { SellerNotice } from '../types/sellerHub';

export const sellerNotices: SellerNotice[] = [
  { id: 'order', icon: 'receipt', tone: 'primary', title: 'Đơn hàng mới #NX-8821 đã thanh toán', body: 'Khách hàng Nguyễn V. vừa hoàn tất thanh toán 38.000.000 đ cho...', time: '5 phút trước' },
  { id: 'bid', icon: 'hammer', tone: 'danger', title: 'Canon EOS R6 có lượt đấu mới!', body: 'User bidder_viet99 vừa đặt mức thầu mới: 52.400.000 đ (+1.4M)...', time: '12 phút trước' },
  { id: 'sold', icon: 'patch-check', tone: 'neutral', title: 'Sản phẩm NIK-50-AIS đã bán đứt', body: 'Ống kính Nikkor 50mm f/1.2 AIS được kích hoạt tùy chọn “Mua...”', time: '42 phút trước' },
  { id: 'stock', icon: 'archive', tone: 'danger', title: 'Cảnh báo kho: SKU LEO-900R', body: 'Tồn kho khả dụng giảm còn 4 chiếc. Dự kiến cạn kiệt trong 48...', time: '1 giờ trước' },
];
