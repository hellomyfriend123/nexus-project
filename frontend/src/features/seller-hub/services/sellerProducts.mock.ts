// Preserved design fixtures; live API data is not replaced by these values.
import type { ListingDraft, SellerProduct } from '../types/sellerHub';
import laptop from '../../../assets/images/seller-hub/laptop.jpg';
import keyboard from '../../../assets/images/seller-hub/keyboard.jpg';
import camera from '../../../assets/images/seller-hub/camera.jpg';
import headphones from '../../../assets/images/seller-hub/headphones.jpg';

export const initialProducts: SellerProduct[] = [
  { id: '1', name: 'Dell XPS 15 9530', sku: 'DELL-XPS-15', category: 'Laptop & PC', image: laptop, stock: 12, sold: 18, status: 'ready', price: 38000000, note: 'Giá đề xuất: 39.5M' },
  { id: '2', name: 'Bàn phím cơ Leopold FC900R', sku: 'LEO-900R', category: 'Phụ kiện Máy tính', image: keyboard, stock: 4, status: 'low', price: 2900000, note: 'Biên lợi nhuận 24%' },
  { id: '3', name: 'Máy ảnh Canon EOS R6', sku: 'AUC-9941', category: 'Máy ảnh & Quang học', image: camera, stock: 1, status: 'auction', price: 52400000, note: 'Khởi điểm: 45.000.000 đ', bids: 9 },
  { id: '4', name: 'Tai nghe chống ồn Sony WH-5', sku: 'SONY-WH5-SLV', category: 'Âm thanh & Tai nghe', image: headphones, stock: 24, sold: 45, status: 'available', price: 6790000, note: 'Đã áp voucher sàn' },
];

export const initialDraft: ListingDraft = { name: '', category: 'Đồ điện tử & Công nghệ', price: '', stock: '10', buyNow: true, makeOffer: false };
