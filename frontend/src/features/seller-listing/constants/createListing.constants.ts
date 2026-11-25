// UI configuration preserved from the original consumers.
import type { ListingConditionOption, ListingSaleMode } from '../types/createListing';
export const listingBrands = ['Canon', 'Sony', 'Nikon', 'Fujifilm', 'Leica', 'Panasonic Lumix'];

export const listingConditions: ListingConditionOption[] = [
  { id: 'new', title: 'Mới 100% Nguyên Seal', caption: 'Chưa kích hoạt, nguyên hộp' },
  { id: 'like-new', title: 'Like New 99%', caption: 'Rất ít dùng, không vết xước' },
  { id: 'used', title: 'Đã qua sử dụng (95-98%)', caption: 'Ngoại hình đẹp, sử dụng tốt' },
  { id: 'fair', title: 'Trầy xước nhẹ (Fair)', caption: 'Hoạt động chuẩn, xước dăm' },
];

export const listingSaleModes: ListingSaleMode[] = [
  {
    id: 'fixed',
    title: 'Bán giá cố định',
    badge: 'Mua ngay',
    badgeTone: 'primary',
    caption: 'Khách có thể đặt mua thanh toán trực tiếp',
    enabled: true,
  },
  {
    id: 'offer',
    title: 'Cho phép Trả giá',
    badge: 'Make Offer',
    badgeTone: 'tertiary',
    caption: 'Nhận đề nghị giá từ người mua uy tín',
    enabled: true,
  },
  {
    id: 'auction',
    title: 'Đấu giá trực tiếp',
    badge: 'Live Auction',
    badgeTone: 'secondary',
    caption: 'Tạo phiên đấu giá đếm ngược 24h - 7 ngày',
    enabled: false,
  },
];
