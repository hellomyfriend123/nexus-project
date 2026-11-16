import type { RegisterErrors, RegisterInput } from '../types/auth';

// UI validation only; the backend must enforce its own registration policy.
export function validateRegister(input: RegisterInput): RegisterErrors {
  const errors: RegisterErrors = {};
  if (input.username.trim().length < 3 || input.username.trim().length > 100) errors.username = 'Tên đăng nhập cần từ 3 đến 100 ký tự.';
  if (input.phone.trim() && !/^\+?[0-9]{8,15}$/.test(input.phone.trim())) errors.phone = 'Số điện thoại không hợp lệ.';
  if (input.fullName.trim().length > 150) errors.fullName = 'Họ và tên tối đa 150 ký tự.';
  if (!input.fullName.trim()) {
    errors.fullName = 'Vui lòng nhập họ và tên.';
  }
  if (!input.email.trim()) {
    errors.email = 'Vui lòng nhập email.';
  } else if ((input.email.trim().length > 255 || !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/.test(input.email.trim()))) {
    errors.email = 'Email không đúng định dạng.';
  }
  if (!input.password) {
    errors.password = 'Vui lòng nhập mật khẩu.';
  } else if (input.password.length < 6 || input.password.length > 128) {
    errors.password = 'Mật khẩu cần từ 6 đến 128 ký tự.';
  }
  if (!input.confirmPassword) {
    errors.confirmPassword = 'Vui lòng xác nhận mật khẩu.';
  } else if (input.confirmPassword !== input.password) {
    errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
  }
  return errors;
}
