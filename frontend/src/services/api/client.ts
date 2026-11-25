import { clearSessionForAuthorization, getSession } from '../auth/session';

export class ApiError extends Error {
  constructor(public status: number, message: string, public details: unknown[] = [], public code?: string, public data?: unknown) {
    super(message); this.name = 'ApiError';
  }
}
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
/** Backend controllers return DTOs directly (including PageResponse.content), not envelopes. */
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!path.startsWith('/api/')) throw new ApiError(0, 'Invalid API path.');
  const headers = new Headers(options.headers);
  const session = getSession();
  if (session && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${session.accessToken}`);
  if (options.body != null && !(options.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');
  let response: Response;
  try { response = await fetch(API_BASE_URL + path, { ...options, headers }); }
  catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError(0, 'Không thể kết nối máy chủ. Vui lòng thử lại.');
  }
  let text: string;
  try { text = response.status === 204 ? '' : await response.text(); }
  catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError(0, 'Kết nối bị gián đoạn khi nhận phản hồi. Vui lòng thử lại.');
  }
  let body: unknown = null;
  if (text) { try { body = JSON.parse(text); } catch { if (response.ok) throw new ApiError(response.status, 'Phản hồi máy chủ không hợp lệ.'); } }
  if (!response.ok) {
    if (response.status === 401 && headers.has('Authorization')) {
      clearSessionForAuthorization(headers.get('Authorization'));
    }
    const error = body && typeof body === 'object' ? body as { message?: unknown; details?: unknown[]; error?: unknown; code?: unknown; data?: unknown } : null;
    throw new ApiError(response.status, typeof error?.message === 'string' && error.message ? error.message : `Yêu cầu không thành công (${response.status}).`, Array.isArray(error?.details) ? error.details : [], typeof error?.error === 'string' ? error.error : typeof error?.code === 'string' ? error.code : undefined, error?.data);
  }
  return body as T;
}
export interface PageResponse<T> { content: T[]; page: number; size: number; totalElements: number; totalPages: number; first: boolean; last: boolean }
export function apiErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return 'Yêu cầu không thành công.';
  if (!(error instanceof ApiError)) return error.message;
  const fields = error.details.flatMap(detail => {
    if (!detail || typeof detail !== 'object') return [];
    const item = detail as { field?: unknown; message?: unknown };
    return typeof item.message === 'string' ? [(typeof item.field === 'string' ? item.field + ': ' : '') + item.message] : [];
  });
  return fields.length ? error.message + ': ' + fields.join('; ') : error.message;
}
