// Legacy UI fixture only. Not used by the live result screen. TODO: remove after visual fixture migration.
import camera from '../../../assets/images/seller-hub/camera.jpg';
import type { Recommendation } from '../types/auctionResult';
// TODO: Replace mock recommendations and repeated placeholder photos with approved API/assets.
export const winnerRecommendationsMock: Recommendation[] = [
  { id: 'rec-1', brand: 'ỐNG KÍNH CANON RF', title: 'Ống kính Canon RF 24-70mm F2.8 L IS USM (Chính hãng LBM - Like New 98%)', image: camera, price: 42200000, badge: 'Còn 42m', bids: '24 lượt bid' },
  { id: 'rec-2', brand: 'SONY MIRRORLESS', title: 'Máy ảnh Sony Alpha A7 IV (ILCE-7M4) Body (38MP Chính hãng Sony VN)', image: camera, price: 39500000, badge: 'Còn 3h 18m', bids: '31 lượt bid' },
  { id: 'rec-3', brand: 'NIKON FX', title: 'Nikon Z6 II kèm KIT Z 24-70mm F4 S (Hàng VN, 99%, chụp 1.100 shots)', image: camera, price: 34800000, badge: 'Còn 1 ngày', bids: '15 lượt bid' },
  { id: 'rec-4', brand: 'CANON R SYSTEM FLAGSHIP', title: 'Thân máy ảnh Canon EOS R5 45MP 8K RAW (Chính hãng Brand New 100%)', image: camera, price: 59800000, badge: 'Mua Ngay (Buy It Now)', bids: 'Free ship', buyNow: true },
];
export const loserRecommendationsMock: Recommendation[] = [
  { id: 'lost-rec-1', brand: 'CANON', title: 'Canon EOS R6 Mark II Body / Fullbox - Ngoại hình 99%, bảo hành 1 năm', image: camera, price: 34500000, badge: 'Còn 42 phút', bids: '18 lượt đấu giá' },
  { id: 'lost-rec-2', brand: 'SONY', title: 'Sony Alpha A7 Mark IV (ILCE-7M4) Body - Bảo hành chính hãng 12/2025', image: camera, price: 37000000, badge: 'Còn 2 giờ 15 phút', bids: '37 lượt đấu giá' },
  { id: 'lost-rec-3', brand: 'CANON', title: 'Canon EOS R5 45MP 8K Raw - Cảm biến Full Frame, ngoại hình đẹp', image: camera, price: 52800000, badge: 'Mua Ngay Giá Tốt', bids: 'Miễn phí vận chuyển', buyNow: true },
  { id: 'lost-rec-4', brand: 'NIKON', title: 'Nikon Z6 Mark II (Z6II) Body - Fullbox, bảo hành chính hãng', image: camera, price: 28900000, badge: 'Còn 5 giờ', bids: '12 lượt đấu giá' },
];
