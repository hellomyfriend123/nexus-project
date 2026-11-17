/** Feature orchestration: view adapters never run in transport. */
import { adminUsersApi as users, adminCatalogApi as catalog, adminCommerceApi as commerce, adminAuctionApi as auction, adminFulfillmentApi as fulfillment } from '../../../services/api/adminApi';
import { mapPage, reviewView, auctionView, inventoryView } from './admin.adapters';
import type { CategoryResponse, ProductResponse } from '../../../services/api/admin.contracts';
import type { AdminCategory, AdminProduct } from '../types/admin.types';
const categoryView = (row: CategoryResponse): AdminCategory => ({ ...row, isActive: row.status === 'ACTIVE' });
const productView = (row: ProductResponse): AdminProduct => ({ ...row, price: row.basePrice, imageUrl: row.primaryImageUrl, sellerName: row.sellerId });
export const adminUsersApi = users;
export const adminCommerceApi = { ...commerce,
 listOrders: async (...args: Parameters<typeof commerce.listOrders>) => mapPage(await commerce.listOrders(...args), row => ({ ...row, itemsCount: row.itemCount })),
};
export const adminCatalogApi = { ...catalog,
 listCategories: async (...args: Parameters<typeof catalog.listCategories>) => mapPage(await catalog.listCategories(...args), categoryView),
 getCategory: async (...args: Parameters<typeof catalog.getCategory>) => categoryView(await catalog.getCategory(...args)),
 listProducts: async (...args: Parameters<typeof catalog.listProducts>) => mapPage(await catalog.listProducts(...args), productView),
 listReviews: async (...args: Parameters<typeof catalog.listReviews>) => mapPage(await catalog.listReviews(...args), reviewView),
};
export const adminAuctionApi = { ...auction, list: async (...args: Parameters<typeof auction.list>) => mapPage(await auction.list(...args), auctionView) };
export const adminFulfillmentApi = { ...fulfillment, listInventories: async (...args: Parameters<typeof fulfillment.listInventories>) => mapPage(await fulfillment.listInventories(...args), inventoryView) };
