// Preserved design fixtures; live API data is not replaced by these values.
import type { ListingDraftForm } from '../types/createListing';

// Chỉ thay bằng REST API khi có Task tích hợp Backend riêng.

export const listingCategoryPath = [
  'Thiết bị số & Công nghệ',
  'Máy ảnh & Ống kính',
];

export const listingCategoryLeaf = 'Thân máy ảnh Mirrorless';

export const listingAccessories = [
  'Pin sạc zin (LP-E6NH)',
  'Dây đeo Canon EOS zin',
  'Hộp Box trùng Serial',
  'Thẻ nhớ SD Sandisk Extreme 64GB',
];

export const listingDescription = `- Thân máy Canon EOS R6 Mark II mua mới đập hộp tại Digiworld Hà Nội, bảo hành chính hãng Lê Bảo Minh đến 11/2026.
- Máy chụp rất ít (khoảng 2.140 shots), chủ yếu chụp gia đình cuối tuần. Luôn để tủ chống ẩm 45% khi không sử dụng.
- Cảm biến sạch bóng không hạt bụi, không quay phim nhiều nên sensor hoàn hảo. Các phím bấm nảy, màn hình đã dán cường lực từ ngày đầu.
- Đi kèm đầy đủ phụ kiện theo máy: Pin LP-E6NH zin, sạc zin LC-E6, dây đeo chưa dùng, hộp sách trùng serial máy.`;

export const initialListingDraft: ListingDraftForm = {
  title: 'Máy ảnh Canon EOS R6 Mark II Fullbox Like New 99% Chính Hãng Lê Bảo Minh',
  brand: 'Canon',
  sku: 'CAM-CANON-R6M2-089',
  shutter: '2.140 shots',
  warranty: 'Bảo hành Lê Bảo Minh 18 tháng',
  origin: 'Chính hãng Việt Nam (LBM)',
  description: listingDescription,
  quantity: 1,
  weight: '1.200 gram',
  length: '25 cm',
  width: '20 cm',
  height: '15 cm',
  price: 38500000,
  dealPrice: 36900000,
  minOffer: 35000000,
};

export const listingWallet = {
  serviceFeeRate: 0.03,
  score: 92,
  scoreLabel: 'Rất Tốt',
};
