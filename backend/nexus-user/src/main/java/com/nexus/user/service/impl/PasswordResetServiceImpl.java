package com.nexus.user.service.impl;

import com.nexus.common.api.ErrorCode;
import com.nexus.common.exception.BusinessException;
import com.nexus.user.dto.publicapi.ForgotPasswordRequest;
import com.nexus.user.dto.publicapi.ForgotPasswordResponse;
import com.nexus.user.dto.publicapi.ResetPasswordRequest;
import com.nexus.user.entity.PasswordResetToken;
import com.nexus.user.entity.User;
import com.nexus.user.enums.UserStatus;
import com.nexus.user.repository.PasswordResetTokenRepository;
import com.nexus.user.repository.UserRepository;
import com.nexus.user.service.PasswordResetService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;

/**
 * Cài đặt {@link PasswordResetService}.
 * <p>
 * Nguyên tắc bảo mật (song song với {@link AuthServiceImpl}):
 * <ul>
 *   <li><b>Chống dò tài khoản:</b> email không tồn tại, tài khoản bị khoá và email hợp lệ đều trả
 *       về cùng một phản hồi trung tính — không có nhánh nào lộ sự tồn tại của tài khoản.</li>
 *   <li><b>Mã 256-bit ngẫu nhiên</b> từ {@link SecureRandom}; server chỉ lưu {@code SHA-256(mã)}
 *       nên lộ DB cũng không tái sử dụng được mã.</li>
 *   <li><b>Dùng một lần + có hạn:</b> mã bị đánh dấu {@code usedAt} khi đổi thành công, và mọi mã
 *       khác của người dùng bị vô hiệu hoá cùng lúc.</li>
 *   <li><b>Không tiết lộ mật khẩu:</b> mật khẩu mới vẫn qua {@link PasswordEncoder} (BCrypt).</li>
 * </ul>
 */
@Slf4j
@Service
public class PasswordResetServiceImpl implements PasswordResetService {

    /** 32 byte = 256 bit ngẫu nhiên → 43 ký tự base64url sau khi mã hoá. */
    private static final int TOKEN_BYTES = 32;

    /** Mã cũ hơn mốc này bị xoá cứng mỗi lần phát mã mới (bảng chỉ là dữ liệu tạm). */
    private static final Duration PURGE_AFTER = Duration.ofDays(7);

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final Duration ttl;
    private final boolean exposeToken;

    public PasswordResetServiceImpl(
            UserRepository userRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordEncoder passwordEncoder,
            @Value("${nexus.security.password-reset.ttl-minutes:" + DEFAULT_TTL_MINUTES + "}") long ttlMinutes,
            @Value("${nexus.security.password-reset.expose-token:false}") boolean exposeToken) {
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.ttl = Duration.ofMinutes(ttlMinutes);
        this.exposeToken = exposeToken;
    }

    @Override
    @Transactional
    public ForgotPasswordResponse requestReset(ForgotPasswordRequest request) {
        String email = normalizeEmail(request.email());

        // Dọn mã hết hạn trước khi ghi bản ghi mới để bảng không phình mãi.
        passwordResetTokenRepository.deleteExpiredBefore(Instant.now().minus(PURGE_AFTER));

        User user = userRepository.findByEmailAndDeletedAtIsNull(email).orElse(null);

        // Email lạ hoặc tài khoản không dùng được → phản hồi GIỐNG HỆT trường hợp thành công.
        if (user == null) {
            log.info("Yêu cầu quên mật khẩu cho email không tồn tại (bỏ qua, không tiết lộ): {}", email);
            return ForgotPasswordResponse.generic();
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            log.info("Yêu cầu quên mật khẩu cho tài khoản {} ở trạng thái {} (bỏ qua)",
                    email, user.getStatus());
            return ForgotPasswordResponse.generic();
        }

        // Mã mới làm chết mọi mã cũ của cùng người dùng: một tài khoản chỉ có tối đa MỘT mã sống.
        passwordResetTokenRepository.markAllUsedByUserId(user.getId(), Instant.now());

        String rawToken = generateRawToken();
        Instant expiresAt = Instant.now().plus(ttl);

        passwordResetTokenRepository.save(PasswordResetToken.builder()
                .userId(user.getId())
                .tokenHash(hash(rawToken))
                .expiresAt(expiresAt)
                .build());

        // Mã thô KHÔNG lưu DB. Ở production nó phải được gửi qua email/SMS — đó là điểm mở rộng
        // PasswordResetNotifier. Hiện tại ghi log để phục vụ dev/demo (vẫn là thông tin nhạy cảm
        // nên chỉ log ở mức DEBUG và không log kèm email).
        log.debug("Đã phát mã đặt lại mật khẩu, hạn dùng {}", expiresAt);
        log.info("Đã tạo mã đặt lại mật khẩu cho tài khoản {}", email);

        // Chỉ trả mã thô khi bật cờ dev; production trả về phản hồi trung tính.
        return exposeToken ? ForgotPasswordResponse.exposed(rawToken, expiresAt) : ForgotPasswordResponse.generic();
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String tokenHash = hash(request.token().trim());

        PasswordResetToken resetToken = passwordResetTokenRepository
                .findByTokenHashAndUsedAtIsNull(tokenHash)
                .orElseThrow(PasswordResetServiceImpl::invalidToken);

        // Kiểm tra hạn dùng tường minh: mã hết hạn mà chưa dùng vẫn phải bị từ chối.
        if (resetToken.getExpiresAt().isBefore(Instant.now())) {
            throw invalidToken();
        }

        User user = userRepository.findByIdAndDeletedAtIsNull(resetToken.getUserId())
                .orElseThrow(PasswordResetServiceImpl::invalidToken);

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.FORBIDDEN,
                    "Tài khoản không ở trạng thái hoạt động nên không thể đặt lại mật khẩu");
        }

        // Trùng mật khẩu cũ thì từ chối: đổi mật khẩu mà không đổi gì là dấu hiệu người dùng
        // nhầm lẫn, và cũng tránh việc mã bị tiêu hao vô ích.
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Mật khẩu mới phải khác mật khẩu hiện tại");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        // Đánh dấu mã đã dùng + vô hiệu hoá mọi mã khác còn sống của người dùng.
        Instant now = Instant.now();
        resetToken.setUsedAt(now);
        passwordResetTokenRepository.save(resetToken);
        passwordResetTokenRepository.markAllUsedByUserId(user.getId(), now);

        log.info("Đặt lại mật khẩu thành công cho tài khoản {}", user.getEmail());
    }

    /** Sinh mã thô: 32 byte ngẫu nhiên, base64url không padding (an toàn cho URL). */
    private static String generateRawToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** Băm SHA-256 dạng hex — server chỉ giữ bản băm, không bao giờ giữ mã thô. */
    private static String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            // SHA-256 là thuật toán bắt buộc của mọi JVM → không thể xảy ra.
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Không băm được mã đặt lại mật khẩu");
        }
    }

    private static BusinessException invalidToken() {
        return new BusinessException(ErrorCode.UNAUTHORIZED,
                "Mã đặt lại mật khẩu không hợp lệ, đã được dùng hoặc đã hết hạn. Vui lòng yêu cầu mã mới.");
    }

    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
