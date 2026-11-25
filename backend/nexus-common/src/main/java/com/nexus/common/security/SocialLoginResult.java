package com.nexus.common.security;

import java.util.List;
import java.util.UUID;

/**
 * Kết quả đăng nhập bằng nhà cung cấp danh tính bên ngoài (Google, ...).
 * <p>
 * {@code accessToken} là token <b>nội bộ</b> do {@link TokenService} sinh (HMAC-SHA256),
 * KHÔNG phải token của Google. Nhờ vậy toàn hệ thống chỉ có một loại token duy nhất
 * và {@link TokenAuthenticationFilter} không cần biết người dùng đăng nhập bằng cách nào.
 *
 * @param accessToken      token nội bộ cấp cho client
 * @param expiresInSeconds thời hạn token (giây)
 * @param userId           khoá chính trong {@code nexus_user.users}
 * @param email            email tài khoản
 * @param fullName         tên hiển thị
 * @param roles            mã vai trò, ví dụ {@code [BUYER]}
 * @param newUser          {@code true} nếu vừa tạo tài khoản ở lần đăng nhập này
 */
public record SocialLoginResult(
        String accessToken,
        long expiresInSeconds,
        UUID userId,
        String email,
        String fullName,
        List<String> roles,
        boolean newUser) {
}
