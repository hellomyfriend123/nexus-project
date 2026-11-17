package com.nexus.user.dto.publicapi;

import jakarta.validation.constraints.NotBlank;

/**
 * Yêu cầu đổi mã dùng-một-lần (nhận từ URL callback) lấy phiên đăng nhập thật.
 * <p>
 * Frontend nhận {@code ?code=...} sau khi Google chuyển hướng về, rồi gọi
 * {@code POST /api/v1/auth/oauth2/exchange} để đổi mã này thành {@link AuthResponse}
 * — cùng hình dạng với {@code POST /api/v1/auth/login}, nên tầng lưu phiên của FE
 * không phải sửa gì.
 *
 * @param code mã dùng một lần do backend sinh ra trong success handler
 */
public record OAuth2ExchangeRequest(
        @NotBlank(message = "Thiếu mã đăng nhập")
        String code
) {
}
