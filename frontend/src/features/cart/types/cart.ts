export type CartItemMode = 'direct' | 'auction';
export type { CartSyncState, CartStockState } from '../utils/cartMutationQueue';

export interface CartItem {
  id: string;
  mode: CartItemMode;
  name: string;
  /** Variant / condition line, e.g. "Near Mint / 1st Edition". */
  variant?: string;
  /** Warehouse label, direct purchase items only. */
  stockLabel?: string;
  image: string;
  unitPrice: number;
  quantity: number;
  /** Upper bound enforced by the quantity stepper. */
  maxQuantity: number;
  sellerName: string;
  /** Seller reputation in percent, auction items only. */
  sellerRating?: number;
  /** Auction session the winning bid belongs to. */
  auctionSessionId?: string;
  /** Locked-price notice shown under the title. */
  auctionNote?: string;
  /** Helper text under the price (e.g. "Giá thắng thầu ..."). */
  priceNote?: string;
  /** Optimistic quantity synchronization state (UI only, never persisted). */
  syncState?: import('../utils/cartMutationQueue').CartSyncState;
  /** Stock state learned from Backend rejections; stock is not exposed on cart lines. */
  stockState?: import('../utils/cartMutationQueue').CartStockState;
}

export type ShippingMethodId = 'standard' | 'express';

export interface ShippingMethod {
  id: ShippingMethodId;
  name: string;
  fee: number;
  eta: string;
  carrier: string;
  /** Secondary line rendered in the danger accent. */
  highlight?: string;
  /** Render the fee as "Miễn phí" instead of a formatted amount. */
  freeLabel: boolean;
}

export type PaymentMethodId = 'vnpay' | 'card' | 'momo' | 'cod';

export interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  description: string;
  /** Short monogram rendered in the leading tile (VNP, MoMo, ...). */
  monogram?: string;
  /** Bootstrap icon rendered in the leading tile. */
  icon?: string;
  /** Accent tile instead of the neutral tile. */
  accent?: boolean;
  badge?: string;
  tag?: string;
  /** Trailing card brand chips (VISA, MC). */
  brands?: string[];
  trailingIcon?: string;
}

export interface Voucher {
  code: string;
  discount: number;
  description: string;
  /** Auction wins are excluded from voucher discounts (FR-20). */
  directOnly: boolean;
}

export interface DeliveryAddress {
  id: string;
  receiverName: string;
  phone: string;
  line: string;
  isDefault: boolean;
  verified: boolean;
}

export interface CartTotals {
  directSubtotal: number;
  directCount: number;
  auctionSubtotal: number;
  auctionCount: number;
  shippingFee: number;
  discount: number;
  total: number;
}
