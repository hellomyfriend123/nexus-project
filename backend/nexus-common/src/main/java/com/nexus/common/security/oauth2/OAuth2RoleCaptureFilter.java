package com.nexus.common.security.oauth2;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Ghi nhớ vai trò người dùng chọn ở form đăng nhập ({@code ?role=SELLER}) trong suốt chuyến đi
 * qua Google.
 *
 * <h2>Vì sao cần filter này?</h2>
 * Tưởng như chỉ cần đọc {@code request.getParameter("role")} trong
 * {@link OAuth2LoginSuccessHandler} là đủ — nhưng <b>không</b>. Khi Google gọi lại, trình duyệt
 * chỉ gửi:
 * <pre>
 * GET /login/oauth2/code/google?code=4/0AX...&amp;state=abc...
 * </pre>
 * Tham số {@code role} đã biến mất từ lâu. Lý do nằm trong
 * {@code DefaultOAuth2AuthorizationRequestResolver#expandRedirectUri}: nó dựng
 * {@code redirect_uri} từ URL hiện tại nhưng gọi {@code UriComponentsBuilder.replaceQuery(null)}
 * để bỏ toàn bộ query string — vì {@code redirect_uri} phải khớp <b>chính xác từng ký tự</b> với
 * giá trị đã khai báo ở Google Cloud Console, thêm query vào là bị
 * {@code Error 400: redirect_uri_mismatch}.
 *
 * <p>Vậy thông tin không thể đi qua URL của Google. Nó đi qua <b>session</b> — vốn đã tồn tại
 * trong luồng OAuth2 để lưu tham số {@code state}. Filter này chép {@code ?role=} vào session
 * <i>trước</i> khi Spring Security dựng yêu cầu uỷ quyền; success handler đọc lại rồi xoá.
 *
 * <p>Chỉ khớp đúng một URL ({@code /oauth2/authorization/*}) nên không ảnh hưởng API khác.
 *
 * @see OAuth2LoginSuccessHandler
 * @see GoogleOAuth2Config
 */
public class OAuth2RoleCaptureFilter extends OncePerRequestFilter {

    /** Tên thuộc tính session. Có tiền tố {@code nexus.} để không đụng khoá của Spring Security. */
    public static final String ROLE_SESSION_ATTRIBUTE = "nexus.oauth2.requested-role";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // Chỉ ghi khi client thực sự gửi tham số; không ghi đè bằng null để tránh xoá giá trị
        // của một lượt đăng nhập đang dang dở trong cùng session.
        String role = request.getParameter("role");
        if (role != null && !role.isBlank()) {
            // getSession(true): session chắc chắn được tạo ngay sau đó bởi
            // OAuth2AuthorizationRequestRedirectFilter (nó phải lưu authorization request),
            // nên tạo sớm ở đây không phát sinh session "thừa".
            HttpSession session = request.getSession(true);
            session.setAttribute(ROLE_SESSION_ATTRIBUTE, role.trim());
        }
        filterChain.doFilter(request, response);
    }

    /** Đọc vai trò đã ghi nhớ (nếu có) rồi xoá khỏi session — mỗi lượt đăng nhập chỉ dùng một lần. */
    static String consumeRequestedRole(HttpSession session) {
        if (session == null) {
            return null;
        }
        Object value = session.getAttribute(ROLE_SESSION_ATTRIBUTE);
        if (value == null) {
            return null;
        }
        session.removeAttribute(ROLE_SESSION_ATTRIBUTE);
        return value.toString();
    }
}
