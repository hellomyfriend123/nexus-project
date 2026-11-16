package com.nexus.common.security;

import com.nexus.common.api.ErrorCode;
import com.nexus.common.exception.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * FR-02: token phải có chữ ký và hạn dùng.
 * Đây là test thuần (không Spring context, không DB) theo CONVENTIONS §14.
 */
class HmacTokenServiceTest {

    private static final String SECRET = "chuoi-bi-mat-cho-test-dai-hon-32-ky-tu";

    private final TokenService tokenService = new HmacTokenService(SECRET, 60);

    @Test
    @DisplayName("Token sinh ra đọc lại đúng userId, email và roles")
    void generateThenParseReturnsSameClaims() {
        UUID userId = UUID.randomUUID();

        String token = tokenService.generate(userId, "buyer@nexus.local", List.of("BUYER"));
        TokenPayload payload = tokenService.parse(token);

        assertThat(payload.userId()).isEqualTo(userId);
        assertThat(payload.email()).isEqualTo("buyer@nexus.local");
        assertThat(payload.roles()).containsExactly("BUYER");
        assertThat(payload.expiresAt()).isAfter(java.time.Instant.now());
    }

    @Test
    @DisplayName("Sửa nội dung token thì chữ ký sai → UNAUTHORIZED")
    void tamperedTokenIsRejected() {
        String token = tokenService.generate(UUID.randomUUID(), "a@nexus.local", List.of("BUYER"));
        String tampered = token.substring(0, token.length() - 3) + "aaa";

        assertThatThrownBy(() -> tokenService.parse(tampered))
                .isInstanceOf(BusinessException.class)
                .extracting(ex -> ((BusinessException) ex).getErrorCode())
                .isEqualTo(ErrorCode.UNAUTHORIZED);
    }

    @Test
    @DisplayName("Token hết hạn bị từ chối")
    void expiredTokenIsRejected() {
        TokenService shortLived = new HmacTokenService(SECRET, -1);
        String token = shortLived.generate(UUID.randomUUID(), "a@nexus.local", List.of("BUYER"));

        assertThatThrownBy(() -> shortLived.parse(token))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("hết hạn");
    }

    @Test
    @DisplayName("Token rỗng hoặc sai định dạng bị từ chối")
    void malformedTokenIsRejected() {
        assertThatThrownBy(() -> tokenService.parse("khong-phai-token"))
                .isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> tokenService.parse(""))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("Token ký bằng secret khác không dùng được")
    void tokenFromDifferentSecretIsRejected() {
        TokenService other = new HmacTokenService("mot-chuoi-bi-mat-hoan-toan-khac-123456", 60);
        String token = other.generate(UUID.randomUUID(), "a@nexus.local", List.of("ADMIN"));

        assertThatThrownBy(() -> tokenService.parse(token))
                .isInstanceOf(BusinessException.class);
    }
}
