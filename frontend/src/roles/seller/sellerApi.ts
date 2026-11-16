import { apiClient } from '../../services/api/client';
import type { PageResponse } from '../../services/api/client';

// ============================================================================
// 1. PROFILE SELLER API (FR-03)
// ============================================================================
export interface SellerProfileResponse {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  status: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateSellerProfileRequest {
  fullName?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

export const sellerProfileApi = {
  getProfile: () => apiClient<SellerProfileResponse>('/api/v1/seller/profile'),
  updateProfile: (data: UpdateSellerProfileRequest) =>
    apiClient<SellerProfileResponse>('/api/v1/seller/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// ============================================================================
// 2. CATALOG SELLER API (FR-05, FR-07, FR-08, FR-10 & Query)
// ============================================================================
export interface ProductImageItem {
  id?: string;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface ProductItemResponse {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  sellerId: string;
  categoryId: string;
  categoryName?: string;
  status: 'ACTIVE' | 'INACTIVE';
  images: ProductImageItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface ProductSummaryResponse {
  id: string;
  name: string;
  basePrice: number;
  status: string;
  primaryImageUrl?: string;
  categoryName?: string;
  createdAt: string;
}

export interface CategoryTreeResponse {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  children?: CategoryTreeResponse[];
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  basePrice: number;
  categoryId: string;
  images: { imageUrl: string; isPrimary: boolean; displayOrder: number }[];
}

export interface UpdateProductRequest {
  name: string;
  description?: string;
  basePrice: number;
  images: { imageUrl: string; isPrimary: boolean; displayOrder: number }[];
}

export interface AssignCategoryRequest {
  categoryId: string;
}

export const sellerCatalogApi = {
  listProducts: (params?: { keyword?: string; categoryId?: string; status?: string; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params?.keyword) sp.set('keyword', params.keyword);
    if (params?.categoryId) sp.set('categoryId', params.categoryId);
    if (params?.status) sp.set('status', params.status);
    if (params?.page !== undefined) sp.set('page', String(params.page));
    if (params?.size !== undefined) sp.set('size', String(params.size));
    const qs = sp.toString();
    return apiClient<PageResponse<ProductSummaryResponse>>(`/api/v1/catalog/products${qs ? `?${qs}` : ''}`);
  },
  getProductById: (id: string) => apiClient<ProductItemResponse>(`/api/v1/catalog/products/${id}`),
  createProduct: (data: CreateProductRequest) =>
    apiClient<ProductItemResponse>('/api/v1/seller/catalog/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProduct: (id: string, data: UpdateProductRequest) =>
    apiClient<ProductItemResponse>(`/api/v1/seller/catalog/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProduct: (id: string) =>
    apiClient<void>(`/api/v1/seller/catalog/products/${id}`, {
      method: 'DELETE',
    }),
  assignCategory: (id: string, data: AssignCategoryRequest) =>
    apiClient<ProductItemResponse>(`/api/v1/seller/catalog/products/${id}/category`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  listCategories: () => apiClient<CategoryTreeResponse[]>('/api/v1/catalog/categories'),
};

// ============================================================================
// 3. FULFILLMENT SELLER API (FR-05, FR-13, FR-14, FR-38, FR-39)
// ============================================================================
export interface SkuResponse {
  id: string;
  productId: string;
  code: string;
  name: string;
  price?: number;
  attributes?: Record<string, string>;
  createdAt: string;
}

export interface InventoryResponse {
  id: string;
  skuId: string;
  skuCode?: string;
  skuName?: string;
  warehouseId: string;
  warehouseName?: string;
  quantityOnHand: number;
  quantityReserved: number;
  availableQuantity: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  updatedAt: string;
}

export interface ShipmentResponse {
  id: string;
  orderId: string;
  carrierName: string;
  trackingNumber: string;
  status: 'PENDING' | 'SHIPPED' | 'DELIVERED';
  shippedAt?: string;
  deliveredAt?: string;
}

export interface CreateSkuRequest {
  productId: string;
  code: string;
  name: string;
  initialQuantity?: number;
}

export interface UpdateInventoryRequest {
  operation: 'INCREASE' | 'DECREASE' | 'SET_AVAILABLE';
  quantity: number;
  reason?: string;
}

export interface CreateShipmentRequest {
  orderId: string;
  carrierName: string;
  trackingNumber: string;
}

export interface UpdateShipmentStatusRequest {
  status: 'PENDING' | 'SHIPPED' | 'DELIVERED';
}

export const sellerFulfillmentApi = {
  createSku: (data: CreateSkuRequest) =>
    apiClient<SkuResponse>('/api/v1/seller/fulfillment/skus', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listSkus: (params?: { page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params?.page !== undefined) sp.set('page', String(params.page));
    if (params?.size !== undefined) sp.set('size', String(params.size));
    const qs = sp.toString();
    return apiClient<PageResponse<SkuResponse>>(`/api/v1/seller/fulfillment/skus${qs ? `?${qs}` : ''}`);
  },
  listInventories: (params?: { skuId?: string; productId?: string; keyword?: string; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params?.skuId) sp.set('skuId', params.skuId);
    if (params?.productId) sp.set('productId', params.productId);
    if (params?.keyword) sp.set('keyword', params.keyword);
    if (params?.page !== undefined) sp.set('page', String(params.page));
    if (params?.size !== undefined) sp.set('size', String(params.size));
    const qs = sp.toString();
    return apiClient<PageResponse<InventoryResponse>>(`/api/v1/seller/fulfillment/inventories${qs ? `?${qs}` : ''}`);
  },
  getInventory: (id: string) => apiClient<InventoryResponse>(`/api/v1/seller/fulfillment/inventories/${id}`),
  updateInventory: (id: string, data: UpdateInventoryRequest) =>
    apiClient<InventoryResponse>(`/api/v1/seller/fulfillment/inventories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  createShipment: (data: CreateShipmentRequest) =>
    apiClient<ShipmentResponse>('/api/v1/seller/fulfillment/shipments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateShipmentStatus: (id: string, data: UpdateShipmentStatusRequest) =>
    apiClient<ShipmentResponse>(`/api/v1/seller/fulfillment/shipments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// ============================================================================
// 4. COMMERCE SELLER API (FR-23, FR-24, FR-25)
// ============================================================================
export interface OrderItemLine {
  id: string;
  productId: string;
  productName: string;
  skuCode?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SellerOrderResponse {
  id: string;
  orderNumber: string;
  buyerId: string;
  buyerName?: string;
  buyerPhone?: string;
  shippingAddress?: string;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED';
  items?: OrderItemLine[];
  createdAt: string;
  updatedAt?: string;
}

export interface SellerOrderSummary {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}

export const sellerCommerceApi = {
  listOrders: (params?: { status?: string; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') sp.set('status', params.status);
    if (params?.page !== undefined) sp.set('page', String(params.page));
    if (params?.size !== undefined) sp.set('size', String(params.size));
    const qs = sp.toString();
    return apiClient<PageResponse<SellerOrderSummary>>(`/api/v1/seller/commerce/orders${qs ? `?${qs}` : ''}`);
  },
  getOrder: (id: string) => apiClient<SellerOrderResponse>(`/api/v1/seller/commerce/orders/${id}`),
  updateOrderStatus: (id: string, status: string) =>
    apiClient<SellerOrderResponse>(`/api/v1/seller/commerce/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  cancelOrder: (id: string) =>
    apiClient<SellerOrderResponse>(`/api/v1/seller/commerce/orders/${id}/cancel`, {
      method: 'POST',
    }),
};

// ============================================================================
// 5. AUCTION SELLER API (FR-26, FR-27, FR-37 & Query)
// ============================================================================
export interface AuctionResponse {
  id: string;
  productId: string;
  productName?: string;
  sellerId: string;
  startingPrice: number;
  currentBid?: number;
  stepPrice?: number;
  bidsCount?: number;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
  createdAt: string;
}

export interface CreateAuctionRequest {
  productId: string;
  startingPrice: number;
  startTime: string;
  endTime: string;
}

export interface UpdateAuctionRequest {
  startingPrice: number;
  startTime: string;
  endTime: string;
}

export const sellerAuctionApi = {
  listAuctions: (params?: { status?: string; keyword?: string; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params?.status) sp.set('status', params.status);
    if (params?.keyword) sp.set('keyword', params.keyword);
    if (params?.page !== undefined) sp.set('page', String(params.page));
    if (params?.size !== undefined) sp.set('size', String(params.size));
    const qs = sp.toString();
    return apiClient<PageResponse<AuctionResponse>>(`/api/v1/auction/auctions${qs ? `?${qs}` : ''}`);
  },
  getAuction: (id: string) => apiClient<AuctionResponse>(`/api/v1/auction/auctions/${id}`),
  createAuction: (data: CreateAuctionRequest) =>
    apiClient<AuctionResponse>('/api/v1/seller/auction/auctions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAuction: (id: string, data: UpdateAuctionRequest) =>
    apiClient<AuctionResponse>(`/api/v1/seller/auction/auctions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  cancelAuction: (id: string) =>
    apiClient<AuctionResponse>(`/api/v1/seller/auction/auctions/${id}/cancel`, {
      method: 'POST',
    }),
};
