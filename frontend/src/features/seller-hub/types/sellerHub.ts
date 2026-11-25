export type ProductStatus = 'ready' | 'low' | 'auction' | 'available';
export interface SellerProduct {
  productId?: string; description?: string; images?: string[]; primaryImageUrl?: string | null;
  id: string;
  name: string;
  sku: string;
  category: string;
  image: string;
  stock: number;
  sold?: number;
  status: ProductStatus;
  price: number;
  note: string;
  bids?: number;
}
export interface ListingDraft {
  name: string;
  category: string;
  price: string;
  stock: string;
  buyNow: boolean;
  makeOffer: boolean;
}
export interface SellerNotice {
  id: string;
  icon: string;
  tone: 'primary' | 'danger' | 'neutral';
  title: string;
  body: string;
  time: string;
}

/** Các tab của Seller Hub. `products` là tab đã có thiết kế export. */
export type SellerTabId = 'products' | 'auctions' | 'orders' | 'reports';
export interface SellerTab {
  id: SellerTabId;
  icon: string;
  label: string;
  badge: string;
}

export interface SellerKpi {
  label: string;
  value: string;
  unit: string;
  caption: string;
  icon: string;
  tone: 'primary' | 'danger';
}

/* ----- Phiên đấu giá ----- */
export type AuctionState = 'live' | 'closing' | 'SCHEDULED' | 'ENDED' | 'CANCELLED' | 'SETTLED';
export interface SellerAuction {
  backendStatus?: string; productId?: string; startTime?: string; endTime?: string;
  id: string;
  roomCode: string;
  product: string;
  sku: string;
  image: string;
  currentBid: number;
  startPrice: number;
  bids: number;
  watchers: string;
  endsIn: string;
  state: AuctionState;
  topBidder: string;
}

/* ----- Đơn hàng & vận chuyển ----- */
export type OrderStatus = 'pending' | 'packing' | 'shipping' | 'done' | 'cancelled';
export interface SellerOrder {
  id: string;
  code: string;
  buyer: string;
  contact: string;
  items: string;
  itemCount: string;
  total: number;
  method: string;
  express: boolean;
  status: OrderStatus;
  placedAt: string;
  deadline: string;
}

/* ----- Báo cáo & đánh giá ----- */
export interface RevenuePoint {
  label: string;
  value: number;
  growth: string;
}
export interface TopSku {
  id: string;
  name: string;
  sku: string;
  sold: string;
  revenue: number;
  trend: string;
  tone: 'up' | 'down' | 'flat';
}
export interface ShopReview {
  id: string;
  buyer: string;
  rating: number;
  time: string;
  product: string;
  text: string;
  replied: boolean;
}
export interface ShopRating {
  score: string;
  total: string;
  stars: { star: number; percent: number }[];
}
