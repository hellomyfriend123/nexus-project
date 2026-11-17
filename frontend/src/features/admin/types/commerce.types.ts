import type { UserStatus, OrderStatus, CampaignStatus } from './admin.types';
export interface OrderItemDetail {
  id?: string;
  productId?: string;
  skuId?: string;
  sellerId?: string;
  productNameSnapshot: string;
  skuCodeSnapshot: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}
export interface DetailedAdminOrder {
  id: string;
  orderNumber: string;
  buyerId?: string;
  sellerId?: string;
  orderType?: string;
  status: OrderStatus;
  subtotal?: number;
  discount?: number;
  shippingFee?: number;
  totalAmount: number;
  shippingAddress?: string;
  receiverName?: string;
  receiverPhone?: string;
  discountCode?: string;
  items?: OrderItemDetail[];
  itemCount?: number;
  itemsCount?: number;
  createdAt: string;
  updatedAt?: string;
  buyerName?: string;
  buyerEmail?: string;
  paymentMethod?: string;
  paymentStatus?: 'PAID' | 'UNPAID' | 'REFUNDED';
}
export interface DetailedAdminCampaign {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: CampaignStatus;
  createdAt?: string;
  updatedAt?: string;
}
export interface DetailedAdminCoupon {
  id: string;
  campaignId?: string | null;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minOrderAmount: number;
  usageLimit?: number | null;
  usedCount: number;
  startAt?: string | null;
  endAt?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}
