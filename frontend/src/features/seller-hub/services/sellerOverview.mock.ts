// Preserved design fixtures; live API data is not replaced by these values.
import type { SellerKpi } from '../types/sellerHub';

export const sellerKpis: SellerKpi[] = [
  { label: 'Doanh thu tháng (T3/2025)', value: '142.500.000 đ', unit: '', caption: '+18.4% so với tháng trước', icon: 'cash-stack', tone: 'primary' },
  { label: 'Đơn hàng mới chờ duyệt', value: '8', unit: 'đơn', caption: '3 đơn giao gấp Hỏa Tốc', icon: 'bag-check', tone: 'primary' },
  { label: 'Phiên đấu giá đang chạy', value: '5', unit: 'phiên', caption: '32 lượt bids phát sinh', icon: 'hammer', tone: 'danger' },
  { label: 'Sản phẩm cảnh báo tồn ít', value: '2', unit: 'SKU', caption: 'Dưới ngưỡng tối thiểu 5', icon: 'archive', tone: 'danger' },
];
