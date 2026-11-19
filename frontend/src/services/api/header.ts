import { api, ApiError, type PageResponse } from './client';
import { getCatalogCategories, flattenCategories, getCatalogProduct } from './catalog';
import { adaptCommerceCart } from './commerce';
export interface HeaderCategory { id: string; name: string; children: HeaderCategory[] }
export interface HeaderNotification { id: string; title: string; content?: string; read: boolean; createdAt: string }
const notificationsPath = '/api/v1/notification/notifications';
export const headerApi = {
  categories: (signal?: AbortSignal) => getCatalogCategories(signal).then(flattenCategories),
  cartCount: (signal?: AbortSignal) => api<unknown>('/api/v1/buyer/commerce/cart', { signal })
    .then(adaptCommerceCart).then(cart => cart.items.reduce((total, item) => total + item.quantity, 0)),
  cart: async (signal?: AbortSignal) => {
    const cart = await api<unknown>('/api/v1/buyer/commerce/cart', { signal }).then(adaptCommerceCart);
    const products = new Map(await Promise.all([...new Set(cart.items.map(item => item.productId))].map(async id => {
      try {
        const product = await getCatalogProduct(id, signal);
        return [id, product.name] as const;
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 404) throw error;
        return [id, id] as const;
      }
    })));
    return { ...cart, items: cart.items.map(item => ({ ...item, productName: products.get(item.productId) })) };
  },
  notifications: (signal?: AbortSignal) => api<PageResponse<HeaderNotification>>(notificationsPath + '?size=5', { signal }),
  unreadCount: (signal?: AbortSignal) => api<number>(notificationsPath + '/unread-count', { signal }),
  readAll: () => api(notificationsPath + '/read-all', { method: 'PATCH' }),
  notification: (id: string) => api<HeaderNotification>(notificationsPath + '/' + encodeURIComponent(id)),
  read: (id: string) => api(notificationsPath + '/' + encodeURIComponent(id) + '/read', { method: 'PATCH' }),
};
