// Preserved design fixtures; live API data is not replaced by these values.
﻿
import photo0 from '../../../assets/images/seller-inventory/product-0.jpg';
import photo1 from '../../../assets/images/seller-inventory/product-1.jpg';
import photo2 from '../../../assets/images/seller-inventory/product-2.jpg';
import photo3 from '../../../assets/images/seller-inventory/product-3.jpg';
import photo4 from '../../../assets/images/seller-inventory/product-4.jpg';
import photo5 from '../../../assets/images/seller-inventory/product-5.jpg';

export const inventoryKpis = [
  { label: 'Tổng sản phẩm trong kho', value: '128', unit: 'SKU', icon: 'archive', tone: 'blue', left: '+12 SKU', right: 'so với tháng trước' },
  { label: 'Đang niêm yết cố định', value: '94', unit: 'Mục', icon: 'shop', tone: 'blue', left: 'Tỷ lệ hiển thị 98.4%', right: '2.4k lượt xem/ngày' },
  { label: 'Đang đấu giá trực tiếp', value: '8', unit: 'Phiên', icon: 'hammer', tone: 'red', left: 'Bid cao nhất: 42.500.000 đ', right: '●' },
  { label: 'Cần xử lý & Cảnh báo', value: '6', unit: 'SKU', icon: 'bell', tone: 'amber', left: '2 sắp hết hàng', right: '4 chờ kiểm định' },
];
