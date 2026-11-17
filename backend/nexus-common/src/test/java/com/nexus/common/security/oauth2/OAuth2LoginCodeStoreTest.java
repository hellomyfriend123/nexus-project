package com.nexus.common.security.oauth2;

import com.nexus.common.security.SocialLoginResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Kiểm thử {@link OAuth2LoginCodeStore} — phần bảo mật quan trọng nhất của luồng Google login.
 * <p>
 * Vì sao cần test riêng? Đây là chốt chặn chống lộ token qua URL: mã phải <b>dùng một lần</b>
 * và phải <b>hết hạn</b>. Hai tính chất này rất dễ bị phá vỡ khi refactor (ví dụ đổi
 * {@code remove} thành {@code get}).
 */
class OAuth2LoginCodeStoreTest {

    private static SocialLoginResult result(String email) {
        return new SocialLoginResult("token-" + email, 3600, UUID.randomUUID(), email,
                "Người dùng", List.of("BUYER"), false);
    }

    @Test
    @DisplayName("Mã đổi được đúng một lần, lần thứ hai thất bại")
    void maChiDungDuocMotLan() {
        OAuth2LoginCodeStore store = new OAuth2LoginCodeStore();
        String code = store.issue(result("a@example.com"));

        Optional<SocialLoginResult> first = store.consume(code);
        Optional<SocialLoginResult> second = store.consume(code);

        assertTrue(first.isPresent(), "Lần đổi đầu phải thành công");
        assertEquals("a@example.com", first.get().email());
        assertFalse(second.isPresent(), "Mã đã dùng không được dùng lại");
    }

    @Test
    @DisplayName("Mã không tồn tại trả về rỗng, không ném lỗi")
    void maKhongTonTai() {
        OAuth2LoginCodeStore store = new OAuth2LoginCodeStore();

        assertFalse(store.consume("khong-bao-gio-ton-tai").isPresent());
    }

    @Test
    @DisplayName("Mã null hoặc rỗng trả về rỗng")
    void maNullHoacRong() {
        OAuth2LoginCodeStore store = new OAuth2LoginCodeStore();

        assertFalse(store.consume(null).isPresent());
        assertFalse(store.consume("").isPresent());
        assertFalse(store.consume("   ").isPresent());
    }

    @Test
    @DisplayName("Hai lần phát hành cho hai mã khác nhau")
    void maKhacNhauMoiLan() {
        OAuth2LoginCodeStore store = new OAuth2LoginCodeStore();

        String first = store.issue(result("a@example.com"));
        String second = store.issue(result("a@example.com"));

        assertFalse(first.equals(second), "Mỗi lần phát hành phải là một mã mới");
        // Cả hai đều dùng được độc lập
        assertTrue(store.consume(first).isPresent());
        assertTrue(store.consume(second).isPresent());
    }

    @Test
    @DisplayName("Kết quả trả về giữ nguyên token và vai trò")
    void giuNguyenDuLieu() {
        OAuth2LoginCodeStore store = new OAuth2LoginCodeStore();
        SocialLoginResult original = result("b@example.com");
        String code = store.issue(original);

        SocialLoginResult restored = store.consume(code).orElseThrow();

        assertEquals(original.accessToken(), restored.accessToken());
        assertEquals(original.userId(), restored.userId());
        assertEquals(original.roles(), restored.roles());
        assertEquals(original.expiresInSeconds(), restored.expiresInSeconds());
    }
}
