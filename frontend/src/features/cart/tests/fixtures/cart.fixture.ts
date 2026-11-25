import type {
  CartItem,
  DeliveryAddress,
  PaymentMethod,
  ShippingMethod,
  Voucher,
} from '../../types/cart';
import kashtiraFenrir from '../../../../assets/images/cards/kashtira-fenrir.webp';
import redEyesDarkDragoon from '../../../../assets/images/cards/Red-Eyes Dark Dragoon.webp';

// TODO(cart): UI-only fixtures. Replace with the cart/checkout API once backend
// integration is explicitly requested. Prices are demo values, not real listings.
export const cartSessionCode = '#NX-889342';

/** Auction-win window remaining, in seconds (FR-36 uses a 24h hold). */
export const auctionDeadlineSeconds = 23 * 3600 + 42 * 60 + 15;

export const initialCartItems: CartItem[] = [
  {
    id: 'direct-kashtira-fenrir',
    mode: 'direct',
    name: 'Kashtira Fenrir',
    variant: 'Near Mint / 1st Edition',
    stockLabel: 'Kho Nexus Prime HN',
    image: kashtiraFenrir,
    unitPrice: 450000,
    quantity: 1,
    maxQuantity: 10,
    sellerName: 'Nexus Prime Store',
  },
  {
    id: 'auction-red-eyes-dark-dragoon',
    mode: 'auction',
    name: 'Red-Eyes Dark Dragoon',
    variant: 'Near Mint / Secret Rare',
    image: redEyesDarkDragoon,
    unitPrice: 850000,
    quantity: 1,
    maxQuantity: 1,
    sellerName: 'CardHouse Saigon',
    sellerRating: 99.8,
    auctionSessionId: '#AUC-902',
    auctionNote:
      'Đã khóa giá trúng thầu phiên #AUC-902, vui lòng thanh toán trong 24h',
    priceNote: 'Giá thắng thầu (Bao gồm phí sàn)',
  },
];

export const shippingMethods: ShippingMethod[] = [
  {
    id: 'standard',
    name: 'Giao hàng Tiêu chuẩn',
    fee: 0,
    eta: 'Dự kiến nhận: 2-3 ngày làm việc',
    carrier: 'Đơn vị vận chuyển: Nexus Logistics Fast',
    freeLabel: true,
  },
  {
    id: 'express',
    name: 'Giao hàng Hỏa tốc 24h',
    fee: 45000,
    eta: 'Cam kết nhận hàng trong hôm nay hoặc sáng mai',
    carrier: 'Đơn vị vận chuyển: Nexus Logistics Fast',
    highlight: 'Ưu tiên phân loại hàng dễ vỡ',
    freeLabel: false,
  },
];

export const paymentMethods: PaymentMethod[] = [
  {
    id: 'vnpay',
    name: 'Cổng thanh toán VNPay QR',
    description: 'Quét mã QR qua hơn 40 ứng dụng ngân hàng và ví điện tử',
    monogram: 'VNP',
    badge: 'Khuyên dùng',
    trailingIcon: 'bi-qr-code-scan',
  },
  {
    id: 'card',
    name: 'Thẻ Quốc tế (Visa / Mastercard / JCB / Amex)',
    description: 'Miễn phí giao dịch quốc tế, xác thực 3D Secure 2.0',
    icon: 'bi-credit-card-2-front',
    brands: ['VISA', 'MC'],
  },
  {
    id: 'momo',
    name: 'Ví điện tử MoMo',
    description: 'Liên kết tài khoản tức thì, hoàn tiền điểm thưởng Nexus',
    monogram: 'MoMo',
    accent: true,
    trailingIcon: 'bi-wallet2',
  },
  {
    id: 'cod',
    name: 'Thanh toán khi nhận hàng (COD)',
    description:
      'Chỉ áp dụng cho món hàng Mua ngay (Giá trị dưới 5.000.000 đ)',
    icon: 'bi-cash-coin',
    tag: 'Hạn chế đơn đấu giá',
  },
];

export const deliveryAddress: DeliveryAddress = {
  id: 'address-default',
  receiverName: 'Alex Nguyen',
  phone: '(+84) 912 345 678',
  line: 'Tầng 8, Tòa nhà Nexus Tower, Phố Duy Tân, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội',
  isDefault: true,
  verified: true,
};

/** Mock voucher catalogue. Validation is local only (no API call). */
export const vouchers: Voucher[] = [
  {
    code: 'NEXUSWELCOME',
    discount: 150000,
    description: 'Ưu đãi chào mừng thành viên mới Nexus',
    directOnly: true,
  },
];

export const defaultVoucherCode = 'NEXUSWELCOME';

