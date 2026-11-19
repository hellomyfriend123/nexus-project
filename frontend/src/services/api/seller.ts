import { api, ApiError, apiErrorMessage } from './client';
import { adaptUserProfile, type UpdateProfileInput } from './buyer';
const rawGet = <T>(path: string, signal?: AbortSignal) => api<T>('/api/v1' + path, { method: 'GET', signal });
const rawRequest = <T>(path: string, options: RequestInit) => api<T>('/api/v1' + path, options);
export interface Page<T> { content: T[]; page: number; size: number; totalElements: number; totalPages: number; first: boolean; last: boolean }
export interface Category { id: string; name: string; status: string; children: Category[] }
export interface Product { id: string; sellerId: string; name: string; description: string | null; basePrice: number; categoryId: string; categoryName: string; status: string; images: string[]; primaryImageUrl?: string | null }
export interface ProductInput { name: string; description: string; basePrice: number; images: { imageUrl: string; primary: boolean }[] }
export interface Inventory { id: string; skuId: string; productId: string; skuCode: string; skuName: string | null; warehouseId: string; totalQuantity: number; availableQuantity: number; status: string }
export interface Sku { id: string; productId: string; sellerId: string; skuCode: string; name: string | null; price: number | null }
export interface SkuInput { productId: string; skuCode: string; name?: string; price?: number; initialTotalQuantity?: number; initialAvailableQuantity?: number }
export interface OrderItem { id: string; productId: string; skuId?: string | null; productNameSnapshot: string; skuCodeSnapshot?: string | null; quantity: number; unitPrice: number; subtotal: number }
export interface Order { id: string; orderNumber: string; status: string; totalAmount: number; itemCount?: number; createdAt: string; receiverName?: string; receiverPhone?: string; shippingAddress?: string; items?: OrderItem[] }
const productPath = '/seller/catalog/products';
const fulfillmentPath = '/seller/fulfillment';
const orderPath = '/seller/commerce/orders';
const json = (method: string, data?: unknown): RequestInit => ({ method, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
export const sellerApi = {
    categories: (signal?: AbortSignal) => apiGet<Category[]>('/catalog/categories', signal),
    product: (id: string, signal?: AbortSignal) => apiGet<Product>('/catalog/products/' + encodeURIComponent(id), signal),
    createProduct: (data: ProductInput & { categoryId: string }) => apiRequest<Product>(productPath, json('POST', data)),
    updateProduct: (id: string, data: ProductInput) => apiRequest<Product>(productPath + '/' + encodeURIComponent(id), json('PUT', data)),
    uploadProductImage: async (id: string, file: File): Promise<string> => {
      const body = new FormData();
      body.append('file', file);
      const result = await rawRequest<unknown>(productPath + '/' + encodeURIComponent(id) + '/images/upload', { method: 'POST', body });
      if (!record(result) || typeof result.publicUrl !== 'string') throw new Error('Phản hồi upload ảnh không hợp lệ.');
      let url: URL;
      try { url = new URL(result.publicUrl); } catch { throw new Error('Phản hồi upload ảnh không hợp lệ.'); }
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Phản hồi upload ảnh không hợp lệ.');
      return result.publicUrl;
    },
    assignCategory: (id: string, categoryId: string) => apiRequest<Product>(productPath + '/' + encodeURIComponent(id) + '/category', json('PATCH', { categoryId })),
    deleteProduct: (id: string) => apiRequest<void>(productPath + '/' + encodeURIComponent(id), json('DELETE')),
    inventories: (query: URLSearchParams, signal?: AbortSignal) => apiGet<Page<Inventory>>(fulfillmentPath + '/inventories?' + query, signal),
    updateInventory: (id: string, operation: string, quantity: number) => apiRequest<Inventory>(fulfillmentPath + '/inventories/' + encodeURIComponent(id), json('PATCH', { operation, quantity })),
    skus: (page: number, signal?: AbortSignal) => apiGet<Page<Sku>>(fulfillmentPath + '/skus?page=' + page + '&size=10', signal),
    createSku: (data: SkuInput) => apiRequest<Sku>(fulfillmentPath + '/skus', json('POST', data)),
    orders: (page: number, status: string, signal?: AbortSignal) => apiGet<Page<Order>>(orderPath + '?page=' + page + '&size=10' + (status ? '&status=' + encodeURIComponent(status) : ''), signal),
    order: (id: string, signal?: AbortSignal) => apiGet<Order>(orderPath + '/' + encodeURIComponent(id), signal),
    updateOrder: (id: string, status: string) => apiRequest<Order>(orderPath + '/' + encodeURIComponent(id) + '/status', json('PATCH', { status })),
    cancelOrder: (id: string) => apiRequest<Order>(orderPath + '/' + encodeURIComponent(id) + '/cancel', json('POST')),
    profile: (signal?: AbortSignal) => api<unknown>('/api/v1/seller/profile', { signal }).then(adaptUserProfile),
    updateProfile: (input: UpdateProfileInput) => api<unknown>('/api/v1/seller/profile', json('PUT', input)).then(adaptUserProfile),
};
export const messageOf = apiErrorMessage;
export function flatCategories(rows: Category[]): Category[] { return rows.flatMap(row => [row, ...flatCategories(row.children ?? [])]); }
export const nextOrderStatus: Record<string, string> = { PENDING: 'CONFIRMED', CONFIRMED: 'SHIPPING', SHIPPING: 'COMPLETED' };
export const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function text(value: unknown) { return typeof value === 'string'; }
function money(value: unknown) { return (typeof value === 'number' || typeof value === 'string') && String(value).trim() !== '' && Number.isFinite(Number(value)); }
function strings(value: Record<string, unknown>, keys: string[]) { return keys.every(k => text(value[k])); }
function item(value: unknown, kind: string): boolean {
    if (!record(value)) return false;
    if (kind === 'inventory') return strings(value, ['id', 'skuId', 'productId', 'skuCode', 'warehouseId', 'status']) && (value.skuName == null || text(value.skuName)) && ['totalQuantity', 'availableQuantity'].every(k => Number.isInteger(value[k]) && Number(value[k]) >= 0);
    if (kind === 'sku') return strings(value, ['id', 'productId', 'sellerId', 'skuCode']) && (value.name == null || text(value.name)) && (value.price == null || money(value.price));
    if (kind === 'product') return strings(value, ['id', 'sellerId', 'name', 'status']) && (value.categoryId == null || text(value.categoryId)) && (value.primaryImageUrl == null || text(value.primaryImageUrl)) && (value.description == null || text(value.description)) && money(value.basePrice) && Array.isArray(value.images) && value.images.every(text);
    if (kind === 'order') return strings(value, ['id', 'orderNumber', 'status', 'createdAt']) && money(value.totalAmount) && (value.itemCount === undefined || (Number.isInteger(value.itemCount) && Number(value.itemCount) >= 0));
    return false;
}
function category(value: unknown): boolean { return record(value) && strings(value, ['id', 'name', 'status']) && Array.isArray(value.children) && value.children.every(category); }
function validate<T>(path: string, value: unknown): T {
    let valid = false;
    if (path === '/catalog/categories') valid = Array.isArray(value) && value.every(category);
    else {
        const kind = path.includes('/inventories') ? 'inventory' : path.includes('/skus') ? 'sku' : path.includes('/orders') ? 'order' : 'product';
        const paged = path.includes('?');
        if (paged) valid = record(value) && Array.isArray(value.content) && value.content.every(v => item(v, kind)) && ['page', 'size', 'totalElements', 'totalPages'].every(k => Number.isInteger(value[k]) && Number(value[k]) >= 0) && typeof value.first === 'boolean' && typeof value.last === 'boolean';
        else valid = item(value, kind);
        if (valid && kind === 'order' && !paged) { valid = record(value) && Array.isArray(value.items) && value.items.every(v => record(v) && strings(v, ['id', 'productId', 'productNameSnapshot']) && Number.isInteger(v.quantity) && money(v.unitPrice) && money(v.subtotal)); }
    }
    if (!valid) throw new Error('Phản hồi API bán hàng không hợp lệ. Vui lòng tải lại.');
    if (record(value) && !path.includes('?') && !path.includes('/inventories') && !path.includes('/skus') && !path.includes('/orders') && path !== '/catalog/categories') {
      return { ...value, categoryId: value.categoryId ?? '', categoryName: value.categoryName ?? '' } as T;
    }
    return value as T;
}
async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> { return validate<T>(path, await rawGet<unknown>(path, signal)); }
async function apiRequest<T>(path: string, options: RequestInit): Promise<T> { const result = await rawRequest<unknown>(path, options); return options.method === 'DELETE' ? undefined as T : validate<T>(path, result); }

export async function loadSellerInventory(signal?: AbortSignal) {
 const inventories: Inventory[] = [];
 for(let page=0;;page++) { const result=await sellerApi.inventories(new URLSearchParams({page:String(page),size:'100'}),signal); inventories.push(...result.content); if(result.last || page+1>=result.totalPages) break; }
 const products=new Map<string,Product>();
 await Promise.all([...new Set(inventories.map(i=>i.productId))].map(async id => {
   try { products.set(id, await sellerApi.product(id, signal)); }
   catch (error) {
     // Catalog soft-deletes do not remove fulfillment rows. Skip only missing products;
     // authentication, permission, network and malformed responses must still surface.
     if (!(error instanceof ApiError) || error.status !== 404) throw error;
   }
 }));
 return {inventories: inventories.filter(row => products.has(row.productId)),products};
}
export async function loadSellerOrders(signal?: AbortSignal) {
 const orders:Order[]=[];
 for(let page=0;;page++){const result=await sellerApi.orders(page,'',signal);orders.push(...result.content);if(result.last || page+1>=result.totalPages)break;}
 return orders;
}

export interface Auction {id:string;productId:string;sellerId:string;startingPrice:number;currentPrice:number;startTime:string;endTime:string;status:string;highestBidderId?:string;acceptedBidCount?:number}
export async function loadSellerAuctions(sellerId:string,signal?:AbortSignal){const rows:Auction[]=[];for(let page=0;;page++){const result=await rawGet<Page<Auction>>('/auction/auctions?page='+page+'&size=100',signal);if(!result||!Array.isArray(result.content)||!Number.isInteger(result.totalPages)||result.totalPages<0||typeof result.last!=='boolean')throw new Error('Phản hồi đấu giá không hợp lệ.');rows.push(...result.content.filter(a=>a.sellerId===sellerId));if(result.last||page+1>=result.totalPages)break;}return Promise.all(rows.map(a=>rawGet<Auction>('/auction/auctions/'+encodeURIComponent(a.id),signal)));}
export const mutateAuction=(id:string|null,data?:unknown)=>rawRequest<Auction>('/seller/auction/auctions'+(id?'/'+encodeURIComponent(id):''),json(id?'PUT':'POST',data));
export const cancelAuction=(id:string)=>rawRequest<Auction>('/seller/auction/auctions/'+encodeURIComponent(id)+'/cancel',json('POST'));

export interface Shipment {id:string;orderId:string;trackingNumber?:string;status:string}
export const createShipment=(orderId:string,trackingNumber:string)=>rawRequest<Shipment>('/seller/fulfillment/shipments',json('POST',{orderId,trackingNumber}));
export const updateShipment=(id:string,status:string)=>rawRequest<Shipment>('/seller/fulfillment/shipments/'+encodeURIComponent(id)+'/status',json('PATCH',{status}));

/** Product PUT replaces its image list, so preserve the independent primary URL. */
export function productImagesForUpdate(product: { images?: string[]; primaryImageUrl?: string | null }) {
  const images = product.images ?? [];
  const primaryIndex = Math.max(0, images.indexOf(product.primaryImageUrl ?? ''));
  return images.map((imageUrl, index) => ({ imageUrl, primary: index === primaryIndex }));
}
