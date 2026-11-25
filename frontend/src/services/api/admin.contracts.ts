export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED';
export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'ENDED';
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';
/** DTOs verified against dev/backend admin controller responses. */
export interface ReviewResponse { id: string; productId: string; buyerId: string; orderId: string; score: number; comment: string; status: 'VISIBLE' | 'HIDDEN'; createdAt: string }
export interface BidResponse { id: string; auctionId: string; bidderId: string; amount: number; status: string; placedAt: string }
export interface AuctionResponse { id: string; productId: string; sellerId: string; startingPrice: number; currentPrice: number; startTime: string; endTime: string; status: 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED'; highestBidderId: string | null; bidCount: number; acceptedBidCount: number; bids: BidResponse[] }
export interface InventoryResponse { id: string; skuId: string; productId: string; skuCode: string; skuName: string; warehouseId: string; totalQuantity: number; availableQuantity: number; status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'; createdAt: string; updatedAt: string }

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

export interface DetailedAdminUser {
  id: string;
  email: string;
  username?: string;
  fullName: string;
  phone?: string;
  phoneNumber?: string;
  identityNumber?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  role?: string;
  roles?: string[];
  status: UserStatus;
  createdAt: string;
  updatedAt?: string;
  totalOrders?: number;
  totalSpent?: number;
  notes?: string;
}

export interface CategoryResponse { id: string; name: string; description?: string; parentId?: string | null; status: 'ACTIVE' | 'INACTIVE'; sortOrder: number; children: CategoryResponse[] }
export interface ProductResponse { id: string; name: string; description?: string; basePrice: number; status: ProductStatus; sellerId: string; categoryId: string; categoryName: string; primaryImageUrl?: string; images?: string[]; createdAt: string; updatedAt?: string }
export interface WarehouseResponse { id: string; code: string; name: string; address: string; status: 'ACTIVE' | 'INACTIVE'; createdAt: string; updatedAt: string }
export interface CategoryRequest { name: string; description?: string; parentId?: string | null; sortOrder?: number; status?: 'ACTIVE' | 'INACTIVE' }
export type CampaignRequest = Pick<DetailedAdminCampaign, 'name' | 'description' | 'startDate' | 'endDate' | 'status'>;
export type DiscountCodeRequest = Omit<DetailedAdminCoupon, 'id' | 'usedCount' | 'createdAt' | 'updatedAt'>;
export interface WarehouseRequest { name: string; address: string; status?: 'ACTIVE' | 'INACTIVE' }

export interface AuctionMutationResponse extends Omit<AuctionResponse, 'bidCount' | 'bids'> { createdAt: string; updatedAt: string }
