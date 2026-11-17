import type { AuthRole, LoginInput, LoginResponse, MeResponse, RegisterInput } from './auth.types';
import { AuthApiError } from './auth.error';
import { beginSessionRevision, getSessionRevision, clearSession, clearSessionForAuthorization, getSession, saveSession, sessionChanged, storage } from '../auth/session';
export { AuthApiError } from './auth.error';
export { clearSession, clearSessionForAuthorization, getSession, saveSession } from '../auth/session';
const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    const headers = new Headers(options.headers);
    headers.set('Accept', 'application/json');
    if (options.body != null && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    response = await fetch(baseUrl + '/api/v1/auth' + path, { ...options, headers });
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new AuthApiError(0, 'Không thể kết nối máy chủ. Vui lòng thử lại.');
  }
  let text: string;
  try { text = response.status === 204 ? '' : await response.text(); }
  catch (error) {
    if (options.signal?.aborted) throw error;
    throw new AuthApiError(0, 'Kết nối bị gián đoạn khi nhận phản hồi. Vui lòng thử lại.');
  }
  let body: any = null;
  if (text) {
    try { body = JSON.parse(text); }
    catch { if (response.ok) throw new AuthApiError(0, 'Phản hồi máy chủ không hợp lệ.'); }
  }
  if (!response.ok) {
    if (response.status === 401) clearSessionForAuthorization(new Headers(options.headers).get('Authorization'));
    throw new AuthApiError(response.status, body?.message || 'Yêu cầu không thành công. Vui lòng thử lại.', Array.isArray(body?.details) ? body.details : []);
  }
  return body as T;
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
  const expiresAt = Date.now() + response.expiresIn * 1000;
  if (!Number.isFinite(expiresAt) || !Number.isFinite(new Date(expiresAt).getTime())) return null;
  return {
    userId: profile.userId,
    ...(profile.username === undefined ? {} : { username: profile.username }),
    email: profile.email,
    fullName: profile.fullName,
    roles: profile.roles,
    accessToken: response.accessToken,
    tokenType: 'Bearer',
    expiresAt: new Date(expiresAt).toISOString(),
  };
}
export async function login(input: LoginInput, remember: boolean, signal?: AbortSignal) {
  const revision = beginSessionRevision();
  const response = await request<unknown>('/login', { method: 'POST', signal, body: JSON.stringify({ email: input.identifier.trim(), password: input.password }) });
  if (signal?.aborted || revision !== getSessionRevision()) throw new DOMException('Aborted', 'AbortError');
  const session = normalizeLogin(response);
  if (!session) throw new AuthApiError(0, 'Phản hồi máy chủ không hợp lệ.');
  // The selector is a requested destination, never an authorization control.
  if (!session.roles.includes('ADMIN') && !session.roles.includes(input.role.toUpperCase())) throw new AuthApiError(403, 'Tài khoản không có vai trò đã chọn.');
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
  const session = getSession(); clearSession(); sessionChanged();
  if (session) await request<void>('/logout', { method: 'POST', signal, headers: { Authorization: 'Bearer ' + session.accessToken } });
}

// Tab-bound UX intent only; Spring Security validates OAuth state server-side.
const googleIntentKey = 'nexus.auth.google-intent';
export function beginGoogleSignIn(role: AuthRole, remember: boolean): string {
  beginSessionRevision();
  if (role !== 'buyer' && role !== 'seller') throw new AuthApiError(400, 'Invalid role.');
  try {
    const store = storage('sessionStorage');
    if (!store) throw new Error('Storage unavailable');
    store.setItem(googleIntentKey, JSON.stringify({ role, remember, createdAt: Date.now() }));
  } catch { throw new AuthApiError(0, 'Please enable browser storage and retry Google sign-in.'); }
  return baseUrl + '/oauth2/authorization/google?role=' + role.toUpperCase();
}
export async function completeGoogleSignIn(search: string, isActive: () => boolean = () => true): Promise<{ session: LoginResponse; role: AuthRole }> {
  let intent: { role: AuthRole; remember: boolean; createdAt: number } | null = null;
  try {
    const store = storage('sessionStorage');
    const raw = store?.getItem(googleIntentKey);
    store?.removeItem(googleIntentKey); // Consume even on errors; never replay callbacks.
    if (raw) intent = JSON.parse(raw);
  } catch { /* Fail closed for unavailable or malformed storage. */ }
  const params = new URLSearchParams(search);
  const code = params.get('code');
  if (!intent || !['buyer', 'seller'].includes(intent.role) || typeof intent.remember !== 'boolean' || !Number.isFinite(intent.createdAt) || intent.createdAt > Date.now() || Date.now() - intent.createdAt > 15 * 60 * 1000 || params.has('error') || params.getAll('code').length !== 1 || !code || !/^[a-f0-9]{32}$/.test(code) || [...params.keys()].some(key => !['code', 'newUser'].includes(key)) || params.getAll('newUser').length > 1 || (params.has('newUser') && !['true', 'false'].includes(params.get('newUser')!))) {
    throw new AuthApiError(400, 'Google sign-in was cancelled, invalid or expired. Please retry.');
  }
  const revision = getSessionRevision();
  const response = await request<unknown>('/oauth2/exchange', { method: 'POST', body: JSON.stringify({ code }) });
  const session = normalizeLogin(response);
  if (!session) throw new AuthApiError(0, 'Invalid server response.');
  if (!isActive() || revision !== getSessionRevision()) throw new DOMException('Aborted', 'AbortError');
  if (!session.roles.includes(intent.role.toUpperCase())) throw new AuthApiError(403, 'Account does not have the selected role.');
  saveSession(session, intent.remember);
  return { session, role: intent.role };
}
