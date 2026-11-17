// Preserved design fixtures; live API data is not replaced by these values.
import type { ListingShippingMethod } from '../types/createListing';

// Chỉ thay bằng REST API khi có Task tích hợp Backend riêng.

export const listingShippingMethods: ListingShippingMethod[] = [
  {
    id: 'nexus-express',
    title: 'Nexus Express Priority (Nội thành hỏa tốc 2h - 4h)',
    badge: 'Được đề xuất',
    caption: 'Được đối soát bưu tá tận tay và chụp ảnh niêm phong',
    fee: '35.000 đ',
    enabled: true,
  },
  {
    id: 'vnpost',
    title: 'VNPost Hàng Giá Trị Cao (Toàn quốc 24-48h)',
    caption: 'Bảo hiểm hàng công nghệ điện tử 100% khai giá',
    fee: '65.000 đ',
    enabled: true,
  },
];
