package com.nexus.common.security;

import java.util.List;
import java.util.UUID;

/**
 * Sinh và kiểm tra token xác thực (FR-02).
 * <p>
 * Hiện tại dùng {@link HmacTokenService}. Khi cần JWT chuẩn (ví dụ để tích hợp OAuth2),
 * chỉ cần thêm một implementation mới (dùng thư viện jjwt) và đánh dấu {@code @Primary} —
 * không phải sửa controller hay filter.
 */
public interface TokenService {

    String generate(UUID userId, String email, List<String> roles);

    /** @throws com.nexus.common.exception.BusinessException nếu token sai chữ ký hoặc hết hạn */
    TokenPayload parse(String token);

    long ttlSeconds();
}
