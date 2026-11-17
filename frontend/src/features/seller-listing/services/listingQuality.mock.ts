// Preserved design fixtures; live API data is not replaced by these values.
import type { ListingQualityItem } from '../types/createListing';

// Chỉ thay bằng REST API khi có Task tích hợp Backend riêng.

export const listingQualityItems: ListingQualityItem[] = [
  { id: 'seo', label: 'Tiêu đề chuẩn công thức SEO (+25đ)', points: '+25đ', done: true },
  { id: 'photos', label: 'Đã có 5+ ảnh chụp góc thực tế (+25đ)', points: '+25đ', done: true },
  { id: 'serial', label: 'Xác thực số Serial máy & Bảo hành (+25đ)', points: '+25đ', done: true },
  { id: 'desc', label: 'Mô tả chi tiết trên 100 ký tự (+17đ)', points: '+17đ', done: true },
  { id: 'video', label: 'Thêm video 360 để đạt 100/100 (+8đ)', points: '+8đ', done: false },
];
