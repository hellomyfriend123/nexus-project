// Legacy UI fixture only. Not used by the live result screen. TODO: remove after visual fixture migration.
import camera from '../../../assets/images/seller-hub/camera.jpg';
import type { AuctionProduct } from '../types/auctionResult';
// TODO: Replace mock product and placeholder photo with approved catalog data/assets.
export const auctionProductMock: AuctionProduct = {
  id: 'canon-r6-mark-ii', title: 'Thân máy ảnh Canon EOS R6 Mark II Mirrorless Body (Fullbox 99% - 2.400 Shutter Shots)',
  image: camera, seller: 'CameraHub VN', condition: 'Đã bóc seal (Like New 99%)',
  location: 'Tân Phú - TP. Hồ Chí Minh', shipping: 'Miễn phí vận chuyển',
};
