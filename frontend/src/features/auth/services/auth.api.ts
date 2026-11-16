import type { LoginInput, LoginResponse, MeResponse, RegisterInput } from '../types/auth';
import adminAccount from '../../admin/mock/adminAccount.mock.json';

export { adminAccount };
const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');
const sessionKey = 'nexus.auth.session';
export class AuthApiError extends Error {
  constructor(public status: number, message: string, public details: { field: string; message: string }[] = []) {
    super(message); this.name = 'AuthApiError';
  }
}
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(baseUrl + '/api/v1/auth' + path, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new AuthApiError(0, 'Không thể kết nối máy chủ. Vui lòng thử lại.');
  }
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && new Headers(options.headers).has('Authorization')) clearSession();
    throw new AuthApiError(response.status, body?.message || 'Yêu cầu không thành công. Vui lòng thử lại.', Array.isArray(body?.details) ? body.details : []);
  }
  return body as T;
}
function isProfile(value: unknown): value is MeResponse {
  if (!value || typeof value !== 'object') return false;
  const user = value as MeResponse;
  // Older backend DTOs omit username; it is not required for authentication.
  return (user.username === undefined || typeof user.username === 'string') && ['userId', 'email', 'fullName'].every((key) => typeof (value as Record<string, unknown>)[key] === 'string') && Array.isArray(user.roles) && user.roles.every((role) => typeof role === 'string');
}
function normalizeProfile(value: unknown): MeResponse | null {
  if (!value || typeof value !== 'object') return null;
  const profile = value as Record<string, unknown>;
  const userId = profile.id;
  if (typeof userId !== 'string' || typeof profile.email !== 'string' || typeof profile.fullName !== 'string' || typeof profile.status !== 'string' || !Array.isArray(profile.roles) || !profile.roles.every((role) => typeof role === 'string') || (profile.username !== undefined && typeof profile.username !== 'string')) return null;
  const normalized: MeResponse = {
    userId,
    email: profile.email,
    fullName: profile.fullName,
    roles: profile.roles,
    status: profile.status,
  };
  if (typeof profile.username === 'string') normalized.username = profile.username;
  return normalized;
}
function normalizeLogin(value: unknown): LoginResponse | null {
  if (!value || typeof value !== 'object') return null;
  const response = value as Record<string, unknown>;
  const profile = normalizeProfile(response.user);
  if (!profile || typeof response.accessToken !== 'string' || !response.accessToken || response.tokenType !== 'Bearer' || typeof response.expiresIn !== 'number' || !Number.isFinite(response.expiresIn) || response.expiresIn <= 0) return null;
  return {
    userId: profile.userId,
    ...(profile.username === undefined ? {} : { username: profile.username }),
    email: profile.email,
    fullName: profile.fullName,
    roles: profile.roles,
    accessToken: response.accessToken,
    tokenType: 'Bearer',
    expiresAt: new Date(Date.now() + response.expiresIn * 1000).toISOString(),
  };
}
function storage(name: 'localStorage' | 'sessionStorage'): Storage | null {
  try { return globalThis[name]; } catch { return null; }
}
// Persist only token and public profile, never credentials. Non-remembered sessions end with the tab.
export function clearSession() {
  for (const store of [storage('localStorage'), storage('sessionStorage')]) {
    try { store?.removeItem(sessionKey); } catch { /* Storage may be disabled. */ }
  }
}
export function getSession(): LoginResponse | null {
  for (const store of [storage('sessionStorage'), storage('localStorage')]) {
    try {
      const raw = store?.getItem(sessionKey);
      if (!raw) continue;
      const session = JSON.parse(raw) as LoginResponse;
      if (!isProfile(session) || !session.accessToken || session.tokenType !== 'Bearer' || !Number.isFinite(Date.parse(session.expiresAt)) || Date.parse(session.expiresAt) <= Date.now()) {
        clearSession(); return null;
      }
      return session;
    } catch { clearSession(); }
  }
  return null;
}
export function saveSession(session: LoginResponse, remember: boolean) {
  if (!isProfile(session) || !session?.accessToken || session.tokenType !== 'Bearer' || !Number.isFinite(Date.parse(session.expiresAt)) || Date.parse(session.expiresAt) <= Date.now()) {
    throw new AuthApiError(0, 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
  }
  clearSession();
  try {
    const store = storage(remember ? 'localStorage' : 'sessionStorage');
    if (!store) throw new Error('Storage unavailable');
    const { accessToken, tokenType, expiresAt, userId, username, email, fullName, roles } = session;
    store.setItem(sessionKey, JSON.stringify({ accessToken, tokenType, expiresAt, userId, username, email, fullName, roles }));
  }
  catch { throw new AuthApiError(0, 'Không thể lưu phiên đăng nhập. Vui lòng bật bộ nhớ trình duyệt.'); }
}
export function loginAsMockAdmin(remember = true): LoginResponse {
  const adminSession: LoginResponse = {
    userId: adminAccount.userId,
    username: adminAccount.username,
    email: adminAccount.email,
    fullName: adminAccount.fullName,
    roles: adminAccount.roles,
    accessToken: adminAccount.accessToken,
    tokenType: 'Bearer',
    expiresAt: new Date(Date.now() + adminAccount.expiresInSeconds * 1000).toISOString(),
  };
  saveSession(adminSession, remember);
  return adminSession;
}

export async function login(input: LoginInput, remember: boolean, signal?: AbortSignal) {
  const idNormalized = input.identifier.trim().toLowerCase();
  // Mock Admin interceptor for testing UI without backend dependency
  if (
    idNormalized === adminAccount.email.toLowerCase() ||
    idNormalized === adminAccount.username.toLowerCase()
  ) {
    if (input.password !== adminAccount.password) {
      throw new AuthApiError(401, 'Mật khẩu tài khoản quản trị viên không chính xác.');
    }
    return loginAsMockAdmin(remember);
  }

  const response = await request<unknown>('/login', { method: 'POST', signal, body: JSON.stringify({ email: input.identifier.trim(), password: input.password }) });
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  const session = normalizeLogin(response);
  if (!session) throw new AuthApiError(0, 'Phản hồi máy chủ không hợp lệ.');
  // The selector is a requested destination, never an authorization control.
  if (!session.roles?.includes(input.role.toUpperCase())) throw new AuthApiError(403, 'Tài khoản không có vai trò đã chọn.');
  saveSession(session, remember);
  return session;
}
export async function register(input: RegisterInput, signal?: AbortSignal) {
  const response = await request<unknown>('/register', { method: 'POST', signal, body: JSON.stringify({ username: input.username.trim(), fullName: input.fullName.trim(), email: input.email.trim(), password: input.password, phone: input.phone.trim() || null, role: input.role.toUpperCase() }) });
  const user = normalizeProfile(response);
  if (!user) throw new AuthApiError(0, 'Phản hồi máy chủ không hợp lệ.');
  return user;
}
export async function me(signal?: AbortSignal) {
  const session = getSession();
  if (!session) throw new AuthApiError(401, 'Phiên đăng nhập đã hết hạn.');
  const response = await request<unknown>('/me', { signal, headers: { Authorization: 'Bearer ' + session.accessToken } });
  const user = normalizeProfile(response);
  if (!user) throw new AuthApiError(0, 'Phản hồi máy chủ không hợp lệ.');
  return user;
}
export async function logout(signal?: AbortSignal) {
  const session = getSession(); clearSession();
  if (session) await request<void>('/logout', { method: 'POST', signal, headers: { Authorization: 'Bearer ' + session.accessToken } });
}
