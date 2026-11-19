import { api as apiClient } from './client';
import type { PageResponse } from './client';
import type { DetailedAdminCampaign, DetailedAdminCoupon, DetailedAdminOrder, DetailedAdminUser, UserStatus, OrderStatus, ProductStatus, CategoryResponse, ProductResponse, WarehouseResponse, ReviewResponse, InventoryResponse, AuctionResponse, CategoryRequest, CampaignRequest, DiscountCodeRequest, WarehouseRequest, AuctionMutationResponse } from './admin.contracts';

// ==========================================
// 1. USERS ADMIN API (FR-04, FR-52)
// ==========================================
export const adminUsersApi = {
  // U-1: Search and list users
  list: (params?: {
    keyword?: string;
    status?: UserStatus | 'ALL';
    role?: string;
    page?: number;
    size?: number;
  }) => {
    const sp = new URLSearchParams();
    if (params?.keyword) sp.set('keyword', params.keyword);
    if (params?.status && params.status !== 'ALL') sp.set('status', params.status);
    if (params?.role && params.role !== 'ALL') sp.set('role', params.role);
    if (params?.page !== undefined) sp.set('page', String(params.page));
    if (params?.size !== undefined) sp.set('size', String(params.size));
    const qs = sp.toString();
    return apiClient<PageResponse<DetailedAdminUser>>(`/api/v1/admin/users${qs ? `?${qs}` : ''}`);
  },

  // U-2: Get user details
  getById: (id: string) => {
    return apiClient<DetailedAdminUser>(`/api/v1/admin/users/${id}`);
  },

  // U-3: Update user status (ACTIVE, INACTIVE, LOCKED)
  updateStatus: (id: string, status: UserStatus) => {
    return apiClient<DetailedAdminUser>(`/api/v1/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// ==========================================
// 2. CATALOG ADMIN API (FR-08, 09, 45, 53, 54, 59)
// ==========================================
export const adminCatalogApi = {
  // Categories (FR-09, FR-54)
  listCategories: (params?: { status?: string; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') sp.set('status', params.status);
    if (params?.page !== undefined) sp.set('page', String(params.page));
    if (params?.size !== undefined) sp.set('size', String(params.size));
    const qs = sp.toString();
    return apiClient<PageResponse<CategoryResponse>>(`/api/v1/admin/catalog/categories${qs ? `?${qs}` : ''}`);
  },

  getCategory: (id: string) => {
    return apiClient<CategoryResponse>(`/api/v1/admin/catalog/categories/${id}`);
  },

  createCategory: (data: CategoryRequest) => {
    return apiClient<CategoryResponse>('/api/v1/admin/catalog/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCategory: (id: string, data: CategoryRequest) => {
    return apiClient<CategoryResponse>(`/api/v1/admin/catalog/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteCategory: (id: string) => {
    return apiClient<void>(`/api/v1/admin/catalog/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Products (FR-08, FR-53)
  listProducts: (params?: {
    keyword?: string;
    categoryId?: string;
    status?: ProductStatus | 'ALL';
    includeDeleted?: boolean;
    page?: number;
    size?: number;
  }) => {
    const sp = new URLSearchParams();
    if (params?.keyword) sp.set('keyword', params.keyword);
    if (params?.categoryId && params.categoryId !== 'ALL') sp.set('categoryId', params.categoryId);
    if (params?.status && params.status !== 'ALL') sp.set('status', params.status);
    if (params?.includeDeleted !== undefined) sp.set('includeDeleted', String(params.includeDeleted));
    if (params?.page !== undefined) sp.set('page', String(params.page));
    if (params?.size !== undefined) sp.set('size', String(params.size));
    const qs = sp.toString();
    return apiClient<PageResponse<ProductResponse>>(`/api/v1/admin/catalog/products${qs ? `?${qs}` : ''}`);
  },

  updateProductStatus: (id: string, status: ProductStatus) => {
    return apiClient<ProductResponse>(`/api/v1/admin/catalog/products/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  deleteProduct: (id: string) => {
    return apiClient<void>(`/api/v1/admin/catalog/products/${id}`, {
      method: 'DELETE',
    });
  },

  // Reviews Moderation (FR-45, FR-59)
  listReviews: (params?: { status?: string; productId?: string; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') sp.set('status', params.status);
    if (params?.productId) sp.set('productId', params.productId);
    if (params?.page !== undefined) sp.set('page', String(params.page));
    if (params?.size !== undefined) sp.set('size', String(params.size));
    const qs = sp.toString();
    return apiClient<PageResponse<ReviewResponse>>(`/api/v1/admin/catalog/reviews${qs ? `?${qs}` : ''}`);
  },

  updateReviewStatus: (id: string, status: 'VISIBLE' | 'HIDDEN') => {
    // Mapping: VISIBLE / HIDDEN per backend controller FR-59
    const backendStatus = status;
    return apiClient<ReviewResponse>(`/api/v1/admin/catalog/reviews/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: backendStatus }),
    });
  },
};

// ==========================================
// 3. COMMERCE ADMIN API (FR-25, 46, 47, 56, 58)
// ==========================================
export const adminCommerceApi = {
  // Orders (FR-56, FR-25)
  listOrders: (params?: {
    buyerId?: string;
    sellerId?: string;
    status?: OrderStatus | 'ALL';
    page?: number;
    size?: number;
    sort?: 'createdAt,asc' | 'createdAt,desc';
  }) => {
    const sp = new URLSearchParams();
    if (params?.buyerId) sp.set('buyerId', params.buyerId);
    if (params?.sellerId) sp.set('sellerId', params.sellerId);
    if (params?.status && params.status !== 'ALL') sp.set('status', params.status);
    if (params?.page !== undefined) sp.set('page', String(params.page));
    if (params?.size !== undefined) sp.set('size', String(params.size));
    if (params?.sort) sp.set('sort', params.sort);
    const qs = sp.toString();
    return apiClient<PageResponse<DetailedAdminOrder>>(`/api/v1/admin/commerce/orders${qs ? `?${qs}` : ''}`);
  },

  getOrder: (id: string) => {
    return apiClient<DetailedAdminOrder>(`/api/v1/admin/commerce/orders/${id}`);
  },

  updateOrderStatus: (id: string, status: OrderStatus) => {
    return apiClient<DetailedAdminOrder>(`/api/v1/admin/commerce/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  cancelOrder: (id: string) => {
    return apiClient<DetailedAdminOrder>(`/api/v1/admin/commerce/orders/${id}/cancel`, {
      method: 'POST',
    });
  },

  // Campaigns (FR-46, FR-58)
  listCampaigns: (params?: { status?: string; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') sp.set('status', params.status);
    if (params?.page !== undefined) sp.set('page', String(params.page));
    if (params?.size !== undefined) sp.set('size', String(params.size));
    const qs = sp.toString();
    return apiClient<PageResponse<DetailedAdminCampaign>>(`/api/v1/admin/commerce/campaigns${qs ? `?${qs}` : ''}`);
  },

  getCampaign: (id: string) => {
    return apiClient<DetailedAdminCampaign>(`/api/v1/admin/commerce/campaigns/${id}`);
  },

  createCampaign: (data: CampaignRequest) => {
    return apiClient<DetailedAdminCampaign>('/api/v1/admin/commerce/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCampaign: (id: string, data: CampaignRequest) => {
    return apiClient<DetailedAdminCampaign>(`/api/v1/admin/commerce/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  endCampaign: (id: string) => {
    return apiClient<void>(`/api/v1/admin/commerce/campaigns/${id}`, {
      method: 'DELETE',
    });
  },

  // Discount Codes / Coupons (FR-47, FR-58)
  listDiscountCodes: (params?: { status?: string; campaignId?: string; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') sp.set('status', params.status);
    if (params?.campaignId) sp.set('campaignId', params.campaignId);
    if (params?.page !== undefined) sp.set('page', String(params.page));
    if (params?.size !== undefined) sp.set('size', String(params.size));
    const qs = sp.toString();
    return apiClient<PageResponse<DetailedAdminCoupon>>(`/api/v1/admin/commerce/discount-codes${qs ? `?${qs}` : ''}`);
  },

  getDiscountCode: (id: string) => {
    return apiClient<DetailedAdminCoupon>(`/api/v1/admin/commerce/discount-codes/${id}`);
  },

  createDiscountCode: (data: DiscountCodeRequest) => {
    return apiClient<DetailedAdminCoupon>('/api/v1/admin/commerce/discount-codes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateDiscountCode: (id: string, data: DiscountCodeRequest) => {
    return apiClient<DetailedAdminCoupon>(`/api/v1/admin/commerce/discount-codes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateDiscountCodeStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') => {
    return apiClient<DetailedAdminCoupon>(`/api/v1/admin/commerce/discount-codes/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// ==========================================
// 4. FULFILLMENT ADMIN API (FR-55)
// ==========================================
export const adminFulfillmentApi = {
  // Inventories tracking
  listInventories: (params?: {
    skuId?: string;
    productId?: string;
    warehouseId?: string;
    status?: string;
    keyword?: string;
    page?: number;
    size?: number;
  }) => {
    const sp = new URLSearchParams();
    if (params?.skuId) sp.set('skuId', params.skuId);
    if (params?.productId) sp.set('productId', params.productId);
    if (params?.warehouseId && params.warehouseId !== 'ALL') sp.set('warehouseId', params.warehouseId);
    if (params?.status && params.status !== 'ALL') sp.set('status', params.status);
    if (params?.keyword) sp.set('keyword', params.keyword);
    if (params?.page !== undefined) sp.set('page', String(params.page));
    if (params?.size !== undefined) sp.set('size', String(params.size));
    const qs = sp.toString();
    return apiClient<PageResponse<InventoryResponse>>(`/api/v1/admin/fulfillment/inventories${qs ? `?${qs}` : ''}`);
  },

  // Warehouses
  listWarehouses: (params?: { status?: string; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') sp.set('status', params.status);
    if (params?.page !== undefined) sp.set('page', String(params.page));
    if (params?.size !== undefined) sp.set('size', String(params.size));
    const qs = sp.toString();
    return apiClient<PageResponse<WarehouseResponse>>(`/api/v1/admin/fulfillment/warehouses${qs ? `?${qs}` : ''}`);
  },

  getWarehouse: (id: string) => {
    return apiClient<WarehouseResponse>(`/api/v1/admin/fulfillment/warehouses/${id}`);
  },

  createWarehouse: (data: WarehouseRequest & { code: string }) => {
    return apiClient<WarehouseResponse>('/api/v1/admin/fulfillment/warehouses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateWarehouse: (id: string, data: WarehouseRequest) => {
    return apiClient<WarehouseResponse>(`/api/v1/admin/fulfillment/warehouses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ==========================================
// 5. AUCTION ADMIN API (FR-37, FR-57)
// ==========================================
export const adminAuctionApi = {
  // A-1: List all auctions with bid history
  list: (params?: { status?: string; keyword?: string; page?: number; size?: number }) => {
    const sp = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') sp.set('status', params.status);
    if (params?.keyword) sp.set('keyword', params.keyword);
    if (params?.page !== undefined) sp.set('page', String(params.page));
    if (params?.size !== undefined) sp.set('size', String(params.size));
    const qs = sp.toString();
    return apiClient<PageResponse<AuctionResponse>>(`/api/v1/admin/auction/auctions${qs ? `?${qs}` : ''}`);
  },

  // A-2: Emergency cancel auction
  cancel: (id: string) => {
    return apiClient<AuctionMutationResponse>(`/api/v1/admin/auction/auctions/${id}/cancel`, {
      method: 'POST',
    });
  },
};
