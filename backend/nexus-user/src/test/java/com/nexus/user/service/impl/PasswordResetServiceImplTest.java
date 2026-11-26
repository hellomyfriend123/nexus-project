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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Test nghiệp vụ {@link PasswordResetServiceImpl} — thuần Mockito, KHÔNG nạp Spring context (§14 CONVENTIONS).
 * <p>
 * Trọng tâm: (1) không tiết lộ email có tồn tại hay không; (2) mã chỉ dùng một lần và có hạn;
 * (3) mật khẩu mới luôn được băm, không bao giờ lưu bản rõ.
 */
@ExtendWith(MockitoExtension.class)
class PasswordResetServiceImplTest {

    private static final String EMAIL = "buyer01@nexus.local";
    private static final String OLD_HASH = "$2a$10$oldoldoldoldoldoldold";
    private static final String NEW_HASH = "$2a$10$newnewnewnewnewnewnew";
    private static final String NEW_PASSWORD = "MatKhauMoi@123";

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    /** {@code exposeToken = true}: chế độ dev/demo — response chứa mã thô để dùng ngay trên Swagger. */
    private PasswordResetServiceImpl serviceExposingToken;

    /** {@code exposeToken = false}: chế độ production — mã không bao giờ ra khỏi server. */
    private PasswordResetServiceImpl serviceHidingToken;

    @BeforeEach
    void setUp() {
        serviceExposingToken = new PasswordResetServiceImpl(
                userRepository, passwordResetTokenRepository, passwordEncoder, 15L, true);
        serviceHidingToken = new PasswordResetServiceImpl(
                userRepository, passwordResetTokenRepository, passwordEncoder, 15L, false);
    }

    private static User activeUser() {
        return User.builder()
                .id(UUID.randomUUID())
                .email(EMAIL)
                .username("buyer01")
                .passwordHash(OLD_HASH)
                .fullName("Nguyễn Văn A")
                .status(UserStatus.ACTIVE)
                .build();
    }

    private static String sha256Hex(String value) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    @DisplayName("Quên mật khẩu: email không tồn tại → phản hồi trung tính, không ghi DB, không lộ tài khoản")
    void requestReset_emailKhongTonTai_traVePhanHoiTrungTinh() {
        when(userRepository.findByEmailAndDeletedAtIsNull(EMAIL)).thenReturn(Optional.empty());

        ForgotPasswordResponse response = serviceExposingToken.requestReset(new ForgotPasswordRequest(EMAIL));

        assertEquals(ForgotPasswordResponse.GENERIC_MESSAGE, response.message());
        assertNull(response.resetToken(), "Không được phát mã cho email không tồn tại");
        assertNull(response.tokenExpiresAt());
        verify(passwordResetTokenRepository, never()).save(any(PasswordResetToken.class));
    }

    @Test
    @DisplayName("Quên mật khẩu: tài khoản bị khoá → phản hồi trung tinh, không phát mã")
    void requestReset_taiKhoanBiKhoa_traVePhanHoiTrungTinh() {
        User banned = activeUser();
        banned.setStatus(UserStatus.BANNED);
        when(userRepository.findByEmailAndDeletedAtIsNull(EMAIL)).thenReturn(Optional.of(banned));

        ForgotPasswordResponse response = serviceExposingToken.requestReset(new ForgotPasswordRequest(EMAIL));

        assertNull(response.resetToken());
        verify(passwordResetTokenRepository, never()).save(any(PasswordResetToken.class));
    }

    @Test
    @DisplayName("Quên mật khẩu: email hợp lệ → phát mã 43 ký tự, chỉ lưu SHA-256, vô hiệu hoá mã cũ")
    void requestReset_hopLe_phatMaVaChiLuuHash() throws Exception {
        User user = activeUser();
        when(userRepository.findByEmailAndDeletedAtIsNull(EMAIL)).thenReturn(Optional.of(user));

        ForgotPasswordResponse response = serviceExposingToken.requestReset(new ForgotPasswordRequest(EMAIL));

        assertNotNull(response.resetToken());
        assertEquals(43, response.resetToken().length(), "32 byte base64url không padding = 43 ký tự");
        assertTrue(response.tokenExpiresAt().isAfter(Instant.now()));

        ArgumentCaptor<PasswordResetToken> captor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(passwordResetTokenRepository).save(captor.capture());
        PasswordResetToken saved = captor.getValue();

        assertEquals(user.getId(), saved.getUserId());
        assertEquals(64, saved.getTokenHash().length(), "SHA-256 dạng hex = 64 ký tự");
        assertFalse(saved.getTokenHash().contains(response.resetToken()),
                "KHÔNG được lưu mã thô — chỉ lưu bản băm");
        assertEquals(sha256Hex(response.resetToken()), saved.getTokenHash());
        assertNull(saved.getUsedAt());

        // Mã mới phải làm chết mọi mã cũ của cùng người dùng.
        verify(passwordResetTokenRepository).markAllUsedByUserId(eq(user.getId()), any(Instant.class));
    }

    @Test
    @DisplayName("Quên mật khẩu: expose-token=false → mã KHÔNG xuất hiện trong response")
    void requestReset_khongExposeToken_khongTraMa() {
        when(userRepository.findByEmailAndDeletedAtIsNull(EMAIL)).thenReturn(Optional.of(activeUser()));

        ForgotPasswordResponse response = serviceHidingToken.requestReset(new ForgotPasswordRequest(EMAIL));

        assertNull(response.resetToken(), "Production không được trả mã thô ra REST");
        assertNull(response.tokenExpiresAt());
        assertEquals(ForgotPasswordResponse.GENERIC_MESSAGE, response.message());
    }

    @Test
    @DisplayName("Đặt mật khẩu mới: mã không tồn tại → UNAUTHORIZED")
    void resetPassword_maKhongTonTai_nemUnauthorized() {
        when(passwordResetTokenRepository.findByTokenHashAndUsedAtIsNull(anyString()))
                .thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class,
                () -> serviceExposingToken.resetPassword(new ResetPasswordRequest("ma-khong-ton-tai", NEW_PASSWORD)));

        assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        verifyNoInteractions(passwordEncoder);
    }

    @Test
    @DisplayName("Đặt mật khẩu mới: mã đã hết hạn → UNAUTHORIZED, không đổi mật khẩu")
    void resetPassword_maHetHan_nemUnauthorized() throws Exception {
        User user = activeUser();
        PasswordResetToken expired = PasswordResetToken.builder()
                .userId(user.getId())
                .tokenHash(sha256Hex("ma-cu"))
                .expiresAt(Instant.now().minusSeconds(60))
                .build();
        when(passwordResetTokenRepository.findByTokenHashAndUsedAtIsNull(anyString()))
                .thenReturn(Optional.of(expired));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> serviceExposingToken.resetPassword(new ResetPasswordRequest("ma-cu", NEW_PASSWORD)));

        assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Đặt mật khẩu mới: mật khẩu trùng mật khẩu cũ → BAD_REQUEST, mã không bị tiêu hao")
    void resetPassword_trungMatKhauCu_nemBadRequest() {
        User user = activeUser();
        PasswordResetToken token = PasswordResetToken.builder()
                .userId(user.getId())
                .tokenHash("hash")
                .expiresAt(Instant.now().plusSeconds(600))
                .build();
        when(passwordResetTokenRepository.findByTokenHashAndUsedAtIsNull(anyString()))
                .thenReturn(Optional.of(token));
        when(userRepository.findByIdAndDeletedAtIsNull(user.getId())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(NEW_PASSWORD, OLD_HASH)).thenReturn(true);

        BusinessException ex = assertThrows(BusinessException.class,
                () -> serviceExposingToken.resetPassword(new ResetPasswordRequest("ma-hop-le", NEW_PASSWORD)));

        assertEquals(ErrorCode.BAD_REQUEST, ex.getErrorCode());
        verify(userRepository, never()).save(any(User.class));
        verify(passwordResetTokenRepository, never()).markAllUsedByUserId(any(), any());
    }

    @Test
    @DisplayName("Đặt mật khẩu mới: mã hợp lệ → đổi mật khẩu sang bản băm mới, đánh dấu mã đã dùng")
    void resetPassword_hopLe_doiMatKhauVaTieuHaoMa() {
        User user = activeUser();
        PasswordResetToken token = PasswordResetToken.builder()
                .userId(user.getId())
                .tokenHash("hash")
                .expiresAt(Instant.now().plusSeconds(600))
                .build();
        when(passwordResetTokenRepository.findByTokenHashAndUsedAtIsNull(anyString()))
                .thenReturn(Optional.of(token));
        when(userRepository.findByIdAndDeletedAtIsNull(user.getId())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(NEW_PASSWORD, OLD_HASH)).thenReturn(false);
        when(passwordEncoder.encode(NEW_PASSWORD)).thenReturn(NEW_HASH);

        serviceExposingToken.resetPassword(new ResetPasswordRequest("ma-hop-le", NEW_PASSWORD));

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertEquals(NEW_HASH, userCaptor.getValue().getPasswordHash(),
                "Mật khẩu mới phải được băm, không lưu bản rõ");

        assertNotNull(token.getUsedAt(), "Mã phải bị đánh dấu đã dùng");
        verify(passwordResetTokenRepository).save(token);

        // Mọi mã khác còn sống của người dùng cũng phải bị vô hiệu hoá.
        verify(passwordResetTokenRepository).markAllUsedByUserId(eq(user.getId()), any(Instant.class));
    }

    @Test
    @DisplayName("Đặt mật khẩu mới: tài khoản bị khoá giữa lúc phát mã và lúc đổi → FORBIDDEN")
    void resetPassword_taiKhoanBiKhoa_nemForbidden() {
        User banned = activeUser();
        banned.setStatus(UserStatus.INACTIVE);
        PasswordResetToken token = PasswordResetToken.builder()
                .userId(banned.getId())
                .tokenHash("hash")
                .expiresAt(Instant.now().plusSeconds(600))
                .build();
        when(passwordResetTokenRepository.findByTokenHashAndUsedAtIsNull("m"))
                .thenReturn(Optional.of(token));
        when(userRepository.findByIdAndDeletedAtIsNull(banned.getId())).thenReturn(Optional.of(banned));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> serviceExposingToken.resetPassword(new ResetPasswordRequest("m", NEW_PASSWORD)));

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        verify(userRepository, never()).save(any(User.class));
    }
}
