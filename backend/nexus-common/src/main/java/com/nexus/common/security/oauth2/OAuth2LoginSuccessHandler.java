package com.nexus.common.security.oauth2;

import com.nexus.common.security.SocialLoginHandler;
import com.nexus.common.security.SocialLoginResult;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

/**
 * Xử lý sau khi Google xác thực xong: biến danh tính Google thành tài khoản Nexus + token nội bộ,
 * rồi chuyển hướng trình duyệt về frontend kèm <b>mã dùng một lần</b> (không phải token).
 *
 * <pre>
 * FE  ──GET /oauth2/authorization/google?role=BUYER──▶  BE
 * BE  ──302 accounts.google.com──▶  Google  ──(người dùng đồng ý)──▶  BE /login/oauth2/code/google
 * BE  ──tìm/tạo user, ký token HMAC, sinh mã một lần──▶  302 {frontend}/oauth2/callback?code=...
 * FE  ──POST /api/v1/auth/oauth2/exchange {code}──▶  BE  ──▶  AuthResponse (giống hệt /login)
 * </pre>
 *
 * <b>Vì sao không đặt thẳng access token lên URL?</b> Token trên URL sẽ nằm trong lịch sử trình
 * duyệt, log của proxy, header {@code Referer} gửi sang site khác và ảnh chụp màn hình.
 * Kẻ tấn công đọc được URL là chiếm được phiên. Mã dùng-một-lần chỉ sống 60 giây và bị xoá
 * ngay khi đổi — URL bị lộ cũng vô dụng.
 */
@Slf4j
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final SocialLoginHandler socialLoginHandler;
    private final OAuth2LoginCodeStore codeStore;
    private final String frontendCallbackUrl;
    private final String defaultRole;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        if (!(authentication.getPrincipal() instanceof OAuth2User principal)) {
            log.warn("Principal của OAuth2 không phải OAuth2User: {}", authentication.getPrincipal());
            invalidateSession(request);
            redirectWithError(response, "oauth2_failed");
            return;
        }

        // Session của luồng OAuth2 (lưu state + role đã chọn). Lấy một lần, dùng cho cả hai việc.
        HttpSession session = request.getSession(false);

        // Với Google: 'sub' là định danh bền vững (KHÔNG dùng email làm khoá — người dùng có thể
        // đổi email trong tài khoản Google). 'email_verified' cho biết Google đã xác nhận email.
        String subject = claim(principal, "sub");
        String email = claim(principal, "email");
        String name = claim(principal, "name");
        Object verified = principal.getAttributes().get("email_verified");
        boolean emailVerified = verified != null && Boolean.parseBoolean(verified.toString());

        // Người dùng chọn vai trò ở form đăng nhập; FE gắn ?role=... vào URL bắt đầu OAuth.
        // KHÔNG đọc request.getParameter("role") ở đây: khi Google gọi lại, trình duyệt chỉ gửi
        // ?code=...&state=..., tham số role đã mất (Spring Security bỏ query string khỏi
        // redirect_uri để khớp tuyệt đối với khai báo trên Google Cloud Console).
        // OAuth2RoleCaptureFilter đã chép role vào session trước đó — xem filter đó để biết chi tiết.
        String requestedRole = sanitizeRole(OAuth2RoleCaptureFilter.consumeRequestedRole(session));

        SocialLoginResult result;
        try {
            result = socialLoginHandler.authenticate("google", subject, email, name, emailVerified, requestedRole);
        } catch (RuntimeException ex) {
            // Không để lộ chi tiết nội bộ ra URL; FE hiển thị thông báo chung.
            log.warn("Đăng nhập Google thất bại cho email {}: {}", email, ex.getMessage());
            invalidateSession(request);
            redirectWithError(response, "oauth2_failed");
            return;
        }

        String code = codeStore.issue(result);
        String target = UriComponentsBuilder.fromUriString(frontendCallbackUrl)
                .queryParam("code", code)
                .queryParam("newUser", result.newUser())
                .build()
                .toUriString();

        log.info("Đăng nhập Google thành công: {} (vai trò: {})", result.email(), result.roles());

        // Session chỉ phục vụ luồng OAuth2 — huỷ ngay để không còn trạng thái đăng nhập phía server.
        invalidateSession(request);
        response.sendRedirect(target);
    }

    /** Đọc claim từ attribute; thiếu thì trả null (không ném lỗi). */
    private static String claim(OAuth2User principal, String name) {
        Object value = principal.getAttributes().get(name);
        return value == null ? null : value.toString();
    }

    /** Chỉ chấp nhận BUYER/SELLER; rỗng hoặc lạ thì rơi về mặc định. Không tin dữ liệu từ URL. */
    private String sanitizeRole(String role) {
        if (role == null) {
            return defaultRole;
        }
        String upper = role.trim().toUpperCase(Locale.ROOT);
        return ("BUYER".equals(upper) || "SELLER".equals(upper)) ? upper : defaultRole;
    }

    private static void invalidateSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            try {
                session.invalidate();
            } catch (IllegalStateException ignored) {
                // Session đã bị huỷ trước đó — không phải lỗi.
            }
        }
    }

    private void redirectWithError(HttpServletResponse response, String reason) throws IOException {
        String separator = frontendCallbackUrl.contains("?") ? "&" : "?";
        response.sendRedirect(frontendCallbackUrl + separator + "error="
                + URLEncoder.encode(reason, StandardCharsets.UTF_8));
    }
}
