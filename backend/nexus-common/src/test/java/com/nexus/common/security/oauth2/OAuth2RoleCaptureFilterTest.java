package com.nexus.common.security.oauth2;

import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * Kiểm thử {@link OAuth2RoleCaptureFilter}.
 * <p>
 * Filter này tồn tại để bù cho một hành vi của Spring Security: query string bị bỏ khỏi
 * {@code redirect_uri}, nên {@code ?role=} không thể đi vòng qua Google. Nếu filter hỏng,
 * triệu chứng rất khó thấy — mọi tài khoản mới đều thành BUYER mà không có lỗi nào.
 */
class OAuth2RoleCaptureFilterTest {

    private final OAuth2RoleCaptureFilter filter = new OAuth2RoleCaptureFilter();

    @Test
    @DisplayName("?role=SELLER được ghi vào session")
    void ghiRoleVaoSession() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/oauth2/authorization/google");
        request.setParameter("role", "SELLER");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        HttpSession session = request.getSession(false);
        assertEquals("SELLER", session.getAttribute(OAuth2RoleCaptureFilter.ROLE_SESSION_ATTRIBUTE));
        assertNotNull(chain.getRequest(), "Phải chuyển tiếp request xuống chain");
    }

    @Test
    @DisplayName("Không có ?role= thì không tạo session (không phát sinh session thừa)")
    void khongCoRole_khongTaoSession() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/github");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertNull(request.getSession(false), "Không nên tạo session khi không có role");
    }

    @Test
    @DisplayName("?role= rỗng bị bỏ qua, không ghi chuỗi rỗng vào session")
    void roleRong_biBoQua() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/oauth2/authorization/google");
        request.setParameter("role", "   ");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertNull(request.getSession(false));
    }

    @Test
    @DisplayName("Giá trị được trim khi ghi vào session")
    void roleDuocTrim() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/oauth2/authorization/google");
        request.setParameter("role", "  seller  ");

        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        assertEquals("seller", request.getSession().getAttribute(OAuth2RoleCaptureFilter.ROLE_SESSION_ATTRIBUTE));
    }

    @Test
    @DisplayName("consumeRequestedRole đọc được một lần rồi xoá")
    void consume_docMotLan() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/oauth2/authorization/google");
        request.setParameter("role", "SELLER");
        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());
        HttpSession session = request.getSession();

        String first = OAuth2RoleCaptureFilter.consumeRequestedRole(session);
        String second = OAuth2RoleCaptureFilter.consumeRequestedRole(session);

        assertEquals("SELLER", first);
        assertNull(second, "Lần đọc thứ hai phải rỗng — giá trị đã bị xoá");
    }

    @Test
    @DisplayName("consumeRequestedRole(null) trả null, không ném NullPointerException")
    void consume_sessionNull() {
        assertNull(OAuth2RoleCaptureFilter.consumeRequestedRole(null));
    }

    @Test
    @DisplayName("Session của lượt trước không ghi đè lên lượt mới có role rõ ràng")
    void ghiDeGiaTriCu() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/oauth2/authorization/google");
        // Lượt 1: người dùng chọn SELLER rồi bỏ dở
        request.setParameter("role", "SELLER");
        filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        // Lượt 2: cùng session, chọn BUYER
        MockHttpServletRequest second = new MockHttpServletRequest("GET", "/oauth2/authorization/google");
        second.setSession(request.getSession());
        second.setParameter("role", "BUYER");
        filter.doFilter(second, new MockHttpServletResponse(), new MockFilterChain());

        assertEquals("BUYER", second.getSession().getAttribute(OAuth2RoleCaptureFilter.ROLE_SESSION_ATTRIBUTE));
    }
}
