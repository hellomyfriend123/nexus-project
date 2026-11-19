import UnsupportedSection from '../components/UnsupportedSection';

/**
 * Change-password section.
 *
 * Blocked on the backend: AuthService exposes only register/login/logout/getCurrentUser/
 * exchangeOAuth2Code, AuthController has no change-password route, and a repo-wide search for
 * "changePassword|change-password|ChangePassword" in dev/backend returns nothing.
 */
export default function PasswordPage() {
  return (
    <UnsupportedSection
      title="Đổi mật khẩu"
      description="Cập nhật mật khẩu đăng nhập của bạn."
      gap="Backend hiện chưa có endpoint đổi mật khẩu, nên chưa thể lưu mật khẩu mới. Mục này sẽ hoạt động ngay khi API được bổ sung."
      missingEndpoint="POST /api/v1/auth/change-password"
    />
  );
}
