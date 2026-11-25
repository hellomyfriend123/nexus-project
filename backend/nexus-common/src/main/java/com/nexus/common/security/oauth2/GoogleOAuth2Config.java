package com.nexus.common.security.oauth2;

import com.nexus.common.security.SocialLoginHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestRedirectFilter;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Cấu hình đăng nhập bằng Google (OAuth 2.0 / OpenID Connect).
 *
 * <h2>Vì sao cấu hình bằng Java thay vì chỉ dán YAML {@code spring.security.oauth2.client}?</h2>
 * <ul>
 *   <li>Nếu khối YAML tồn tại mà {@code client-id} rỗng (ví dụ biến môi trường chưa đặt),
 *       Spring Boot vẫn tạo {@code ClientRegistration} và <b>ném lỗi ngay khi khởi động</b>:
 *       {@code IllegalArgumentException: clientId cannot be empty}. Nghĩa là ai clone repo mà
 *       chưa có credential Google sẽ không chạy được backend — kể cả khi chỉ muốn xem Swagger.</li>
 *   <li>Bean có điều kiện ({@link ConditionalOnExpression}) cho phép: <b>có</b> credential thì bật
 *       Google login, <b>không có</b> thì ứng dụng khởi động bình thường và các URL OAuth2 đơn giản
 *       là không tồn tại (404), không phải lỗi 500.</li>
 * </ul>
 * Endpoint {@code POST /api/v1/auth/oauth2/exchange} vẫn luôn tồn tại — xem
 * {@link OAuth2SupportConfig} — nên không có chuyện thiếu bean làm sập context.
 *
 * <h2>Vì sao cần một {@code SecurityFilterChain} riêng, có {@code @Order(1)}?</h2>
 * Toàn bộ API chạy {@code STATELESS}. Nhưng luồng OAuth2 cần nhớ "yêu cầu uỷ quyền" (tham số
 * {@code state}) trong khoảng giữa lúc chuyển sang Google và lúc Google gọi lại. Không có chỗ nhớ
 * thì Spring báo {@code authorization_request_not_found} và đăng nhập luôn thất bại.
 * Vì vậy <b>chỉ riêng</b> hai nhóm URL OAuth2 được phép tạo HTTP session
 * ({@link SessionCreationPolicy#IF_REQUIRED}); mọi API khác vẫn stateless tuyệt đối.
 * Session đó bị huỷ ngay trong success handler sau khi đã đổi xong mã dùng-một-lần.
 */
@Configuration
@ConditionalOnExpression("'${nexus.security.oauth2.google.client-id:}'.length() > 0 "
        + "&& '${nexus.security.oauth2.google.client-secret:}'.length() > 0")
public class GoogleOAuth2Config {

    /**
     * Mẫu redirect URI. {@code {baseUrl}} do Spring Security tự thay bằng địa chỉ gốc của request
     * (đúng cả khi chạy localhost:8080 hay sau reverse proxy), {@code {registrationId}} thành
     * {@code google}. Giá trị thực tế phải khai báo y hệt trong Google Cloud Console:
     * {@code http://localhost:8080/login/oauth2/code/google}.
     */
    public static final String REDIRECT_URI_TEMPLATE = "{baseUrl}/login/oauth2/code/{registrationId}";

    /**
     * Khai báo nhà cung cấp Google.
     * <p>
     * Cố tình khai báo <b>tường minh</b> các endpoint thay vì dùng {@code CommonOAuth2Provider}
     * (tiện ích này đã bị thay đổi/deprecated qua các phiên bản Spring Security), để code biên dịch
     * được trên Spring Security 7 và để người đọc thấy rõ backend đang gọi đi đâu.
     * <p>
     * Không đặt {@code clientAuthenticationMethod}: mặc định của {@code ClientRegistration} đã là
     * {@code client_secret_basic} — đúng thứ Google yêu cầu cho confidential client.
     */
    @Bean
    public ClientRegistrationRepository clientRegistrationRepository(
            @Value("${nexus.security.oauth2.google.client-id}") String clientId,
            @Value("${nexus.security.oauth2.google.client-secret}") String clientSecret) {

        ClientRegistration google = ClientRegistration.withRegistrationId("google")
                .clientId(clientId)
                .clientSecret(clientSecret)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri(REDIRECT_URI_TEMPLATE)
                // openid là bắt buộc để Google trả id_token (nguồn của email_verified đã ký)
                .scope("openid", "email", "profile")
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .tokenUri("https://oauth2.googleapis.com/token")
                .userInfoUri("https://openidconnect.googleapis.com/v1/userinfo")
                .jwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
                .issuerUri("https://accounts.google.com")
                .userNameAttributeName("sub")
                .clientName("Google")
                .build();

        return new InMemoryClientRegistrationRepository(google);
    }

    @Bean
    public OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler(
            SocialLoginHandler socialLoginHandler,
            OAuth2LoginCodeStore codeStore,
            @Value("${nexus.security.oauth2.frontend-callback-url:http://localhost:5173/oauth2/callback}")
            String frontendCallbackUrl,
            @Value("${nexus.security.oauth2.default-role:BUYER}") String defaultRole) {

        return new OAuth2LoginSuccessHandler(socialLoginHandler, codeStore, frontendCallbackUrl, defaultRole);
    }

    @Bean
    public OAuth2LoginFailureHandler oAuth2LoginFailureHandler(
            @Value("${nexus.security.oauth2.frontend-callback-url:http://localhost:5173/oauth2/callback}")
            String frontendCallbackUrl) {

        return new OAuth2LoginFailureHandler(frontendCallbackUrl);
    }

    /**
     * Chain riêng cho luồng OAuth2, khớp <b>duy nhất</b> hai nhóm URL:
     * {@code /oauth2/**} (bắt đầu đăng nhập) và {@code /login/oauth2/**} (nhận callback).
     * Nhờ {@code securityMatcher}, chain này không ảnh hưởng bất kỳ API nghiệp vụ nào.
     */
    @Bean
    @Order(1)
    public SecurityFilterChain oauth2LoginFilterChain(
            HttpSecurity http,
            OAuth2LoginSuccessHandler successHandler,
            OAuth2LoginFailureHandler failureHandler) throws Exception {

        http
                .securityMatcher("/oauth2/**", "/login/oauth2/**")
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                // OAuth2 cần session để lưu authorization request (state) giữa 2 lần chuyển trang
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                // Phải đứng TRƯỚC OAuth2AuthorizationRequestRedirectFilter (filter này dựng URL
                // sang Google và bỏ toàn bộ query string khỏi redirect_uri, làm mất ?role=).
                // Thêm tại đây là đứng trước, vì filter OAuth2 được thêm vào sau trong configure().
                .addFilterBefore(new OAuth2RoleCaptureFilter(),
                        OAuth2AuthorizationRequestRedirectFilter.class)
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(successHandler)
                        .failureHandler(failureHandler));

        return http.build();
    }
}
