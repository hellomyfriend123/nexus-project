import type { LoginResponse, MeResponse } from '../api/auth.types';
import { AuthApiError } from '../api/auth.error';
const sessionKey = 'nexus.auth.session';
let sessionRevision = 0;
function isProfile(value: unknown): value is MeResponse {
  if (!value || typeof value !== 'object') return false;
  const user = value as MeResponse;
  // Older backend DTOs omit username; it is not required for authentication.
  return (user.username === undefined || typeof user.username === 'string') && ['userId', 'email', 'fullName'].every((key) => typeof (value as Record<string, unknown>)[key] === 'string') && Array.isArray(user.roles) && user.roles.every((role) => typeof role === 'string');
}
export function sessionChanged() { if (typeof window !== 'undefined') window.dispatchEvent(new Event('nexus:session-changed')); }
export function storage(name: 'localStorage' | 'sessionStorage'): Storage | null {
  try { return globalThis[name]; } catch { return null; }
}
// Persist only token and public profile, never credentials. Non-remembered sessions end with the tab.
export function clearSession() {
  sessionRevision++;
  for (const store of [storage('localStorage'), storage('sessionStorage')]) {
    try { store?.removeItem(sessionKey); } catch { /* Storage may be disabled. */ }
  }
}
// An old request must never invalidate a session established after it was sent.
export function clearSessionForAuthorization(authorization: string | null) {
  const current = getSession();
  if (current && authorization === 'Bearer ' + current.accessToken) { clearSession(); sessionChanged(); }
}
export function getSession(): LoginResponse | null {
  for (const store of [storage('sessionStorage'), storage('localStorage')]) {
    try {
      const raw = store?.getItem(sessionKey);
      if (!raw) continue;
      const session = JSON.parse(raw) as LoginResponse;
      if (!isProfile(session) || typeof session.accessToken !== 'string' || !session.accessToken.trim() || session.tokenType !== 'Bearer' || !Number.isFinite(Date.parse(session.expiresAt)) || Date.parse(session.expiresAt) <= Date.now()) {
        clearSession(); return null;
      }
      return session;
    } catch { clearSession(); }
  }
  return null;
}
export function saveSession(session: LoginResponse, remember: boolean) {
  if (!isProfile(session) || typeof session?.accessToken !== 'string' || !session.accessToken.trim() || session.tokenType !== 'Bearer' || !Number.isFinite(Date.parse(session.expiresAt)) || Date.parse(session.expiresAt) <= Date.now()) {
    throw new AuthApiError(0, 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
  }
  clearSession();
  try {
    const store = storage(remember ? 'localStorage' : 'sessionStorage');
    if (!store) throw new Error('Storage unavailable');
    const { accessToken, tokenType, expiresAt, userId, username, email, fullName, roles } = session;
    store.setItem(sessionKey, JSON.stringify({ accessToken, tokenType, expiresAt, userId, username, email, fullName, roles }));
    sessionChanged();
  }
  catch { throw new AuthApiError(0, 'Không thể lưu phiên đăng nhập. Vui lòng bật bộ nhớ trình duyệt.'); }
}

export function beginSessionRevision() { return ++sessionRevision; }
export function getSessionRevision() { return sessionRevision; }
