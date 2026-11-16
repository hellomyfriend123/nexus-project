package com.nexus.common.security;

import com.nexus.common.api.ErrorCode;
import com.nexus.common.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

/**
 * Token nội bộ: {@code base64url(payload) + "." + base64url(HMAC-SHA256(payload))}.
 * <p>
 * Payload là chuỗi {@code userId|email|role1,role2|expEpochSeconds} — cố tình KHÔNG dùng JSON
 * để tránh phụ thuộc vào Jackson và để token luôn kiểm tra được bằng mắt khi debug.
 * Token này có chữ ký + hạn dùng, đáp ứng FR-02. Muốn chuẩn JWT thì thay implementation.
 */
@Service
public class HmacTokenService implements TokenService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final String SEPARATOR = "|";
    private static final String ROLE_SEPARATOR = ",";

    private final byte[] secretKey;
    private final Duration ttl;

    public HmacTokenService(
            @Value("${nexus.security.token.secret:nexus-dev-secret-doi-truoc-khi-nop}") String secret,
            @Value("${nexus.security.token.ttl-minutes:480}") long ttlMinutes) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("nexus.security.token.secret không được để trống");
        }
        this.secretKey = secret.getBytes(StandardCharsets.UTF_8);
        this.ttl = Duration.ofMinutes(ttlMinutes);
    }

    @Override
    public String generate(UUID userId, String email, List<String> roles) {
        Instant expiresAt = Instant.now().plus(ttl);
        String payload = String.join(SEPARATOR,
                userId.toString(),
                email == null ? "" : email,
                roles == null ? "" : String.join(ROLE_SEPARATOR, roles),
                String.valueOf(expiresAt.getEpochSecond()));
        String encodedPayload = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        return encodedPayload + "." + sign(encodedPayload);
    }

    @Override
    public TokenPayload parse(String token) {
        if (token == null || token.isBlank()) {
            throw unauthorized();
        }
        String[] parts = token.split("\\.", -1);
        if (parts.length != 2) {
            throw unauthorized();
        }
        String expectedSignature = sign(parts[0]);
        boolean signatureValid = MessageDigest.isEqual(
                expectedSignature.getBytes(StandardCharsets.UTF_8),
                parts[1].getBytes(StandardCharsets.UTF_8));
        if (!signatureValid) {
            throw unauthorized();
        }

        String payload;
        try {
            payload = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException ex) {
            throw unauthorized();
        }

        String[] fields = payload.split("\\" + SEPARATOR, -1);
        if (fields.length != 4) {
            throw unauthorized();
        }
        Instant expiresAt;
        UUID userId;
        try {
            expiresAt = Instant.ofEpochSecond(Long.parseLong(fields[3]));
            userId = UUID.fromString(fields[0]);
        } catch (RuntimeException ex) {
            throw unauthorized();
        }
        if (expiresAt.isBefore(Instant.now())) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, "Token đã hết hạn, vui lòng đăng nhập lại");
        }

        List<String> roles = fields[2].isBlank()
                ? List.of()
                : Arrays.stream(fields[2].split(ROLE_SEPARATOR)).filter(r -> !r.isBlank()).toList();

        return new TokenPayload(userId, fields[1], roles, expiresAt);
    }

    @Override
    public long ttlSeconds() {
        return ttl.toSeconds();
    }

    private String sign(String encodedPayload) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secretKey, HMAC_ALGORITHM));
            byte[] signature = mac.doFinal(encodedPayload.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
        } catch (Exception ex) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Không ký được token");
        }
    }

    private static BusinessException unauthorized() {
        return new BusinessException(ErrorCode.UNAUTHORIZED, "Token không hợp lệ");
    }
}
