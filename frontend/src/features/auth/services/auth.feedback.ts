import { AuthApiError } from './auth.api';
import type { RegisterErrors } from '../types/auth';

type AuthFeedback =
  | { kind: 'toast'; message: string }
  | { kind: 'credentials'; message: string }
  | { kind: 'fields'; errors: RegisterErrors }
  | { kind: 'notice'; message: string };

const registerFields = new Set(['username', 'phone', 'fullName', 'email', 'password', 'confirmPassword']);

/** Keep correctable errors next to the form; reserve notifications for system failures. */
export function getAuthErrorFeedback(error: unknown, context: 'login' | 'register'): AuthFeedback {
  const fallback = context === 'login'
    ? 'Không thể kiểm tra đăng nhập. Vui lòng thử lại.'
    : 'Không thể đăng ký. Vui lòng thử lại.';
  if (!(error instanceof AuthApiError)) return { kind: 'toast', message: fallback };
  if (error.status < 400 || error.status >= 500) {
    return { kind: 'toast', message: error.status === 0 ? error.message : fallback };
  }
  if (context === 'login' && error.status === 401) {
    return { kind: 'credentials', message: 'Tài khoản hoặc mật khẩu không đúng.' };
  }
  if (context === 'register') {
    const errors: RegisterErrors = {};
    for (const detail of error.details) {
      if (detail && registerFields.has(detail.field) && typeof detail.message === 'string' && detail.message.trim()) {
        errors[detail.field as keyof RegisterErrors] = detail.message;
      }
    }
    if (Object.keys(errors).length) return { kind: 'fields', errors };
  }
  return { kind: 'notice', message: error.message || fallback };
}
