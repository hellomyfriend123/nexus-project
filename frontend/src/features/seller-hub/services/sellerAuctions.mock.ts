// Preserved design fixtures; live API data is not replaced by these values.
import type { SellerAuction } from '../types/sellerHub';
import lens from '../../../assets/images/seller-inventory/product-1.jpg';
import laptop from '../../../assets/images/seller-hub/laptop.jpg';
import keyboard from '../../../assets/images/seller-hub/keyboard.jpg';
import camera from '../../../assets/images/seller-hub/camera.jpg';
import headphones from '../../../assets/images/seller-hub/headphones.jpg';

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
