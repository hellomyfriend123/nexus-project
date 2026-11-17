import { api, ApiError } from './client';
import { getCatalogProduct } from './catalog';
export interface BuyerProfileResponse { id: string; email: string; username: string; fullName: string | null; phone: string | null; address: string | null; createdAt: string }
export interface CartProduct { id: string; name: string; sellerId: string; basePrice: number; primaryImageUrl: string | null }
function invalid(): never { throw new ApiError(200, 'Invalid buyer response. Please reload.'); }
function record(value: unknown): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid(); return value as Record<string, unknown>; }
function text(value: unknown): string { return typeof value === 'string' ? value : invalid(); }
function nullableText(value: unknown): string | null { return value == null ? null : text(value); }
export function adaptBuyerProfile(value: unknown): BuyerProfileResponse {
  const row = record(value); const createdAt = text(row.createdAt); if (!Number.isFinite(Date.parse(createdAt))) return invalid();
  return { id: text(row.id), email: text(row.email), username: text(row.username), fullName: nullableText(row.fullName), phone: nullableText(row.phone), address: nullableText(row.address), createdAt };
}
function adaptShipments(value: unknown): { trackingNumber: string | null; status: string }[] {
  if (!Array.isArray(value)) return invalid();
  return value.map(value => { const row = record(value); return { trackingNumber: nullableText(row.trackingNumber), status: text(row.status) }; });
}
export const buyerApi = {
  profile: () => api<unknown>('/api/v1/buyer/profile').then(adaptBuyerProfile),
  product: (id: string) => getCatalogProduct(id),
  shipments: (orderId: string) => api<unknown>(`/api/v1/buyer/fulfillment/shipments?orderId=${encodeURIComponent(orderId)}`).then(adaptShipments),
};
