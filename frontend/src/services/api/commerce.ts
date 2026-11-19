import { api, ApiError } from './client';

export interface CommerceCartLine { id: string; productId: string; skuId: string | null; sellerId: string; quantity: number; unitPrice: number; lineTotal: number }
export interface CommerceCart { id: string; subtotal: number; itemCount: number; items: CommerceCartLine[] }
export interface CommerceOrderSummary { id: string; orderNumber: string; sellerId: string; orderType: string; status: string; totalAmount: number; itemCount: number; createdAt: string }
export interface CommerceOrderItem { id: string; productId: string; skuId: string | null; sellerId: string; productNameSnapshot: string; quantity: number; unitPrice: number }
export interface CommerceOrder extends Omit<CommerceOrderSummary, 'itemCount'> { items: CommerceOrderItem[]; shippingAddress: string; receiverName: string; receiverPhone: string }
export interface AddCartLine { productId: string; sellerId: string; skuId?: string | null; productName?: string; quantity: number; unitPrice: number }
interface Page<T> { content: T[]; totalElements: number; totalPages: number }
// Reject malformed DTOs before they reach cart math or mutation reconciliation.
function invalid(): never { throw new ApiError(200, 'Invalid commerce response. Please reload.'); }
function record(value: unknown): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid(); return value as Record<string, unknown>; }
function text(value: unknown): string { return typeof value === 'string' ? value : invalid(); }
function money(value: unknown): number { return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : invalid(); }
function count(value: unknown, minimum = 0): number { return typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum ? value : invalid(); }
function nullableText(value: unknown): string | null { return value == null ? null : text(value); }
function date(value: unknown): string { const result = text(value); return Number.isFinite(Date.parse(result)) ? result : invalid(); }
export function adaptCommerceCart(value: unknown): CommerceCart {
  const row = record(value); if (!Array.isArray(row.items)) return invalid();
  return { id: text(row.id), subtotal: money(row.subtotal), itemCount: count(row.itemCount), items: row.items.map(value => {
    const item = record(value); return { id: text(item.id), productId: text(item.productId), skuId: nullableText(item.skuId), sellerId: text(item.sellerId), quantity: count(item.quantity, 1), unitPrice: money(item.unitPrice), lineTotal: money(item.lineTotal) };
  }) };
}
export function adaptOrderSummary(value: unknown): CommerceOrderSummary {
  const row = record(value);
  if (!['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'].includes(String(row.status)) || !['DIRECT', 'AUCTION'].includes(String(row.orderType))) return invalid();
  return { id: text(row.id), orderNumber: text(row.orderNumber), sellerId: text(row.sellerId), orderType: String(row.orderType), status: String(row.status), totalAmount: money(row.totalAmount), itemCount: count(row.itemCount), createdAt: date(row.createdAt) };
}
export function adaptCommerceOrder(value: unknown): CommerceOrder {
  const row = record(value); if (!Array.isArray(row.items)) return invalid();
  const items = row.items.map(value => { const item = record(value); return { id: text(item.id), productId: text(item.productId), skuId: nullableText(item.skuId), sellerId: text(item.sellerId), productNameSnapshot: text(item.productNameSnapshot), quantity: count(item.quantity, 1), unitPrice: money(item.unitPrice) }; });
  const summary = adaptOrderSummary({ ...row, itemCount: items.length });
  return { ...summary, items, shippingAddress: text(row.shippingAddress), receiverName: text(row.receiverName), receiverPhone: text(row.receiverPhone) };
}
function adaptOrderPage(value: unknown): Page<CommerceOrderSummary> {
  const row = record(value); if (!Array.isArray(row.content)) return invalid();
  return { content: row.content.map(adaptOrderSummary), totalElements: count(row.totalElements), totalPages: count(row.totalPages) };
}
const base = '/api/v1/buyer/commerce';
const json = (method: string, body?: unknown): RequestInit => ({ method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
export const commerceApi = {
  cart: () => api<unknown>(`${base}/cart`).then(adaptCommerceCart),
  add: (line: AddCartLine) => api<unknown>(`${base}/cart/items`, json('POST', line)).then(adaptCommerceCart),
  quantity: (id: string, quantity: number) => api<unknown>(`${base}/cart/items/${encodeURIComponent(id)}`, json('PUT', { quantity })).then(adaptCommerceCart),
  remove: (id: string) => api<void>(`${base}/cart/items/${encodeURIComponent(id)}`, json('DELETE')),
  discount: (code: string, orderAmount: number) => api<unknown>(`${base}/checkout/apply-discount`, json('POST', { code, orderAmount, orderType: 'DIRECT' })).then(value => { const row = record(value); return { code: text(row.code), discountAmount: money(row.discountAmount) }; }),
  checkout: (body: { receiverName: string; receiverPhone: string; shippingAddress: string; paymentMethod: 'COD'; discountCode?: string }) => api<unknown>(`${base}/checkout`, json('POST', body)).then(adaptCommerceOrder),
  orders: (page = 0, status?: string) => api<unknown>(`${base}/orders?page=${page}&size=20&sort=createdAt,desc${status ? `&status=${encodeURIComponent(status)}` : ''}`).then(adaptOrderPage),
  order: (id: string) => api<unknown>(`${base}/orders/${encodeURIComponent(id)}`).then(adaptCommerceOrder),
  cancel: (id: string) => api<unknown>(`${base}/orders/${encodeURIComponent(id)}/cancel`, json('POST')).then(adaptCommerceOrder),
  rateSeller: (orderId: string, sellerId: string, score: number, comment?: string) => api<unknown>(`${base}/seller-ratings`, json('POST', { orderId, sellerId, score, ...(comment?.trim() ? { comment: comment.trim() } : {}) })),
};
