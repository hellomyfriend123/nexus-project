package com.nexus.common.security.oauth2;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Xử lý khi đăng nhập Google thất bại (người dùng bấm "Huỷ", Google trả lỗi, state không khớp...).
 * <p>
 * Chỉ chuyển hướng về frontend kèm mã lỗi ngắn — không đưa thông điệp kỹ thuật lên URL,
 * vì URL hiển thị cho người dùng và có thể bị ghi vào log.
 */
@Slf4j
@RequiredArgsConstructor
public class OAuth2LoginFailureHandler implements AuthenticationFailureHandler {

    private final String frontendCallbackUrl;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request,
                                        HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {
        log.warn("Đăng nhập Google thất bại: {}", exception.getMessage());
        String separator = frontendCallbackUrl.contains("?") ? "&" : "?";
        response.sendRedirect(frontendCallbackUrl + separator + "error="
                + URLEncoder.encode("oauth2_failed", StandardCharsets.UTF_8));
    }
}
