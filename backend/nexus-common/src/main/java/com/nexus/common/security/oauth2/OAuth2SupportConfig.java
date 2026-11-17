package com.nexus.common.security.oauth2;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Bean dùng chung cho luồng OAuth2, <b>luôn tồn tại</b> kể cả khi chưa cấu hình Google.
 * <p>
 * Vì sao tách khỏi {@link GoogleOAuth2Config}? Vì {@code GoogleOAuth2Config} có điều kiện
 * (chỉ bật khi có client-id/secret). Nếu {@link OAuth2LoginCodeStore} nằm trong đó thì endpoint
 * {@code POST /api/v1/auth/oauth2/exchange} sẽ không có bean để inject khi chạy không có Google —
 * ứng dụng sẽ không khởi động được. Tách ra đây để endpoint luôn tồn tại và trả lỗi rõ ràng
 * ("mã không hợp lệ") thay vì làm sập cả ứng dụng.
 */
@Configuration
public class OAuth2SupportConfig {

    @Bean
    public OAuth2LoginCodeStore oAuth2LoginCodeStore() {
        return new OAuth2LoginCodeStore();
    }
}
