import type { RegisterErrors, RegisterInput } from '../types/auth';

// Mirror RegisterRequest validation; backend validation remains authoritative.
export function validateRegister(input: RegisterInput): RegisterErrors {
  const errors: RegisterErrors = {};
  if (input.username.trim().length < 3 || input.username.trim().length > 50) errors.username = 'Tên đăng nhập cần từ 3 đến 50 ký tự.';
  if (!/^[a-zA-Z0-9._-]+$/.test(input.username.trim())) errors.username = 'Tên đăng nhập chỉ gồm chữ cái, chữ số và các ký tự . _ -';
  if (input.phone.trim() && !/^[0-9+][0-9+().\-\s]{7,19}$/.test(input.phone.trim())) errors.phone = 'Số điện thoại không hợp lệ.';
  if (input.fullName.trim().length > 150) errors.fullName = 'Họ và tên tối đa 150 ký tự.';
  if (!input.fullName.trim()) {
    errors.fullName = 'Vui lòng nhập họ và tên.';
  }
  if (!input.email.trim()) {
    errors.email = 'Vui lòng nhập email.';
  } else if ((input.email.trim().length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()))) {
    errors.email = 'Email không đúng định dạng.';
  }
  if (!input.password) {
    errors.password = 'Vui lòng nhập mật khẩu.';
  } else if (!input.password.trim() || input.password.length < 8 || input.password.length > 72) {
    errors.password = 'Mật khẩu cần từ 8 đến 72 ký tự.';
  }
  if (!input.confirmPassword) {
    errors.confirmPassword = 'Vui lòng xác nhận mật khẩu.';
  } else if (input.confirmPassword !== input.password) {
    errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
  }
  return errors;
}
