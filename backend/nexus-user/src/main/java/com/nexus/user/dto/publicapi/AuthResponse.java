package com.nexus.user.dto.publicapi;

import com.nexus.user.dto.common.UserResponse;

/**
 * Kết quả đăng nhập (FR-02): token truy cập + thông tin người dùng.
 * <p>
 * Token được sinh bởi {@code TokenService} của {@code nexus-common}
 * (hiện tại là HMAC có chữ ký + hạn dùng; đổi sang JWT chỉ cần thay implementation).
 *
 * @param accessToken chuỗi token, client gửi kèm header {@code Authorization: Bearer <token>}
 * @param tokenType   luôn là {@value #BEARER}
 * @param expiresIn   số giây token còn hiệu lực
 * @param user        danh tính người dùng vừa đăng nhập
 */
public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UserResponse user
) {

    public static final String BEARER = "Bearer";

    public static AuthResponse of(String accessToken, long expiresIn, UserResponse user) {
        return new AuthResponse(accessToken, BEARER, expiresIn, user);
    }
}
