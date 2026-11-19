import { api, ApiError } from './client';
import { getCatalogProduct } from './catalog';

export type ProfileGender = 'MALE' | 'FEMALE' | 'OTHER';

/** Mirrors backend ProfileResponse (nexus-user dto/buyer/ProfileResponse.java). */
export interface UserProfileResponse {
  id: string;
  email: string;
  username: string;
  fullName: string | null;
  phone: string | null;
  address: string | null;
  dateOfBirth: string | null;
  gender: ProfileGender | null;
  status: string | null;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * Mirrors backend UpdateProfileRequest. Semantics verified in UserServiceImpl.updateProfile:
 * a null field leaves the stored value untouched, an empty string clears it.
 * email/username are intentionally absent — the backend refuses to change them here.
 */
export interface UpdateProfileInput {
  fullName?: string | null;
  phone?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  gender?: ProfileGender | null;
}

/** Backend RegisterRequest.PHONE_PATTERN, reused by UpdateProfileRequest validation. */
export const PHONE_PATTERN = /^$|^[0-9+][0-9+().\-\s]{7,19}$/;

/** Backend @Size limits on UpdateProfileRequest. */
export const FULL_NAME_MAX = 150;
export const ADDRESS_MAX = 255;

export interface CartProduct { id: string; name: string; sellerId: string; basePrice: number; primaryImageUrl: string | null }

function invalid(): never { throw new ApiError(200, 'Invalid buyer response. Please reload.'); }
function record(value: unknown): Record<string, unknown> { if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid(); return value as Record<string, unknown>; }
function text(value: unknown): string { return typeof value === 'string' ? value : invalid(); }
function nullableText(value: unknown): string | null { return value == null ? null : text(value); }
function nullableDate(value: unknown): string | null {
  if (value == null) return null;
  const raw = text(value);
  // dateOfBirth is a LocalDate ("YYYY-MM-DD"); keep it as-is so a date input can consume it.
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : invalid();
}
function nullableGender(value: unknown): ProfileGender | null {
  if (value == null) return null;
  return value === 'MALE' || value === 'FEMALE' || value === 'OTHER' ? value : invalid();
}

export function adaptUserProfile(value: unknown): UserProfileResponse {
  const row = record(value);
  const createdAt = text(row.createdAt);
  if (!Number.isFinite(Date.parse(createdAt))) return invalid();
  return {
    id: text(row.id),
    email: text(row.email),
    username: text(row.username),
    fullName: nullableText(row.fullName),
    phone: nullableText(row.phone),
    address: nullableText(row.address),
    dateOfBirth: nullableDate(row.dateOfBirth),
    gender: nullableGender(row.gender),
    status: nullableText(row.status),
    createdAt,
    updatedAt: row.updatedAt == null ? null : text(row.updatedAt),
  };
}

/** @deprecated kept so existing imports keep working; prefer UserProfileResponse. */
export type BuyerProfileResponse = UserProfileResponse;
export const adaptBuyerProfile = adaptUserProfile;

function adaptShipments(value: unknown): { trackingNumber: string | null; status: string }[] {
  if (!Array.isArray(value)) return invalid();
  return value.map(value => { const row = record(value); return { trackingNumber: nullableText(row.trackingNumber), status: text(row.status) }; });
}

export const buyerApi = {
  profile: (signal?: AbortSignal) => api<unknown>('/api/v1/buyer/profile', { signal }).then(adaptUserProfile),
  updateProfile: (input: UpdateProfileInput) => api<unknown>('/api/v1/buyer/profile', { method: 'PUT', body: JSON.stringify(input) }).then(adaptUserProfile),
  product: (id: string, signal?: AbortSignal) => getCatalogProduct(id, signal),
  shipments: (orderId: string, signal?: AbortSignal) => api<unknown>(`/api/v1/buyer/fulfillment/shipments?orderId=${encodeURIComponent(orderId)}`, { signal }).then(adaptShipments),
};
