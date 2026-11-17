// Preserved design fixtures; live API data is not replaced by these values.
import type { ListingMediaSlot } from '../types/createListing';
import photo0 from '../../../assets/images/seller-inventory/product-0.jpg';
import photo1 from '../../../assets/images/seller-inventory/product-1.jpg';
import photo2 from '../../../assets/images/seller-inventory/product-2.jpg';
import photo3 from '../../../assets/images/seller-inventory/product-3.jpg';
import photo4 from '../../../assets/images/seller-inventory/product-4.jpg';

// Chỉ thay bằng REST API khi có Task tích hợp Backend riêng.

export const listingMediaSlots: ListingMediaSlot[] = [
  { id: 'cover', label: 'Ảnh bìa', image: photo0, cover: true },
  { id: 'sensor', label: 'Cảm biến', image: photo1 },
  { id: 'serial', label: 'Tem & Seri', image: photo2, serialVerified: true },
  { id: 'lcd', label: 'Màn hình lật', image: photo3 },
  { id: 'box', label: 'Fullbox & Phụ kiện', image: photo4 },
];
