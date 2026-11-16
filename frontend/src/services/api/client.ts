import { getSession, clearSession, loginAsMockAdmin } from '../../features/auth/services/auth.api';
import adminAccount from '../../features/admin/mock/adminAccount.mock.json';

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details: any = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  let session = getSession();
  if (
    session &&
    session.accessToken &&
    session.accessToken.startsWith('mock-admin-') &&
    adminAccount.accessToken
  ) {
    session = loginAsMockAdmin(true);
  }
  const token = session?.accessToken;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError(
      0,
      'Không thể kết nối đến máy chủ Nexus (port 8080). Vui lòng kiểm tra lại dịch vụ Backend.',
    );
  }

  if (response.status === 204) {
    return null as unknown as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && headers.has('Authorization')) {
      clearSession();
    }
    const message =
      data?.message ||
      data?.error ||
      `Yêu cầu thất bại với mã lỗi HTTP ${response.status}`;
    throw new ApiError(response.status, message, data?.details || data);
  }

  return data as T;
}
