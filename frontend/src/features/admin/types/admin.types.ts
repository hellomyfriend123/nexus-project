// Types for Nexus Admin Module (covering all 34 tasks across 5 backend domains)

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED';
export type UserRole = 'BUYER' | 'SELLER' | 'ADMINISTRATOR';

export interface AdminUserSummary {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AdminUserDetails extends AdminUserSummary {
  phone?: string;
  roles?: string[];
  address?: string;
  avatarUrl?: string;
  totalOrders: number;
  totalSpent: number;
  notes?: string;
}

// Catalog types
export interface AdminCategory {
  status: 'ACTIVE' | 'INACTIVE';
  sortOrder?: number;
  id: string;
  name: string;
  slug?: string;
  parentId?: string | null;
  parentName?: string;
  description?: string;
  productCount?: number;
  isActive: boolean;
  createdAt?: string;
}

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';

export interface AdminProduct {
  id: string;
  name: string;
  sku?: string;
  categoryName: string;
  categoryId: string;
  price: number;
  originalPrice?: number;
  stockQuantity?: number;
  status: ProductStatus;
  sellerName: string;
  imageUrl?: string;
  createdAt: string;
}

export type ReviewStatus = 'VISIBLE' | 'HIDDEN';

export interface AdminReview {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  userFullName: string;
  rating: number;
  comment: string;
  status: ReviewStatus;
  createdAt: string;
}

// Commerce types
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED';

export interface AdminOrder {
  id: string;
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: 'PAID' | 'UNPAID' | 'REFUNDED';
  itemsCount: number;
  createdAt: string;
  shippingAddress: string;
}

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'ENDED';

export interface AdminCampaign {
  id: string;
  name: string;
  code: string;
  description: string;
  discountPercentage: number;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  usageCount: number;
  budget: number;
}

export type CouponStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

export interface AdminCoupon {
  id: string;
  code: string;
  title: string;
  discountAmount: number;
  discountType: 'PERCENT' | 'FIXED';
  minimumSpend: number;
  usageLimit: number;
  usageCount: number;
  status: CouponStatus;
  expiresAt: string;
}

// Fulfillment types
export interface AdminInventoryItem {
  id: string;
  sku?: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderLevel?: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface AdminWarehouse {
  createdAt?: string;
  id: string;
  name: string;
  code: string;
  address: string;
  city?: string;
  capacityTotal?: number;
  capacityUsed?: number;
  status: 'ACTIVE' | 'INACTIVE';
  contactPhone?: string;
}

// Auction types
export type AuctionStatus = 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';

export interface AdminBid {
  id: string;
  bidderName: string;
  bidderEmail: string;
  amount: number;
  bidTime: string;
  isWinningBid: boolean;
}

export interface AdminAuction {
  id: string;
  title: string;
  productName: string;
  sellerName: string;
  startingPrice: number;
  currentBid: number;
  reservePrice?: number;
  status: AuctionStatus;
  startTime: string;
  endTime: string;
  totalBids: number;
  cancellationReason?: string;
  bids?: AdminBid[];
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalOrders: number;
  totalRevenue: number;
  activeAuctions: number;
  pendingReviews: number;
  lowStockItems: number;
}
