package com.nexus.user.service.impl;

import com.nexus.common.api.ErrorCode;
import com.nexus.common.exception.BusinessException;
import com.nexus.common.exception.DuplicateResourceException;
import com.nexus.common.security.TokenService;
import com.nexus.user.dto.common.UserResponse;
import com.nexus.user.dto.publicapi.AuthResponse;
import com.nexus.user.dto.publicapi.LoginRequest;
import com.nexus.user.dto.publicapi.RegisterRequest;
import com.nexus.user.entity.Role;
import com.nexus.user.entity.User;
import com.nexus.user.entity.UserRole;
import com.nexus.user.enums.UserStatus;
import com.nexus.user.repository.UserRepository;
import com.nexus.user.repository.UserRoleRepository;
import com.nexus.user.service.RoleService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Test nghiệp vụ {@link AuthServiceImpl} — thuần Mockito, KHÔNG nạp Spring context (§14 CONVENTIONS).
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    private static final String EMAIL = "buyer01@nexus.local";
    private static final String PASSWORD = "Buyer@123";
    private static final String PASSWORD_HASH = "$2a$10$abcdefghijklmnopqrstuv";

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserRoleRepository userRoleRepository;

    @Mock
    private RoleService roleService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private TokenService tokenService;

    @InjectMocks
    private AuthServiceImpl authService;

    private static RegisterRequest registerRequest() {
        return new RegisterRequest(EMAIL, "buyer01", PASSWORD, "Nguyễn Văn A", "0912345678",
                RoleService.ROLE_BUYER);
    }

    private static User existingUser(UserStatus status) {
        return User.builder()
                .id(UUID.randomUUID())
                .email(EMAIL)
                .username("buyer01")
                .passwordHash(PASSWORD_HASH)
                .fullName("Nguyễn Văn A")
                .status(status)
                .build();
    }

    @Test
    @DisplayName("FR-01: đăng ký trùng email → DuplicateResourceException (409), không ghi DB")
    void register_trungEmail_nemDuplicateResourceException() {
        when(userRepository.existsByEmailAndDeletedAtIsNull(EMAIL)).thenReturn(true);

        DuplicateResourceException exception = assertThrows(DuplicateResourceException.class,
                () -> authService.register(registerRequest()));

        assertEquals(ErrorCode.CONFLICT, exception.getErrorCode());
        assertTrue(exception.getMessage().contains(EMAIL));
        verify(userRepository, never()).save(any(User.class));
        verifyNoInteractions(userRoleRepository);
    }

    @Test
    @DisplayName("FR-01: đăng ký trùng username → DuplicateResourceException (409)")
    void register_trungUsername_nemDuplicateResourceException() {
        when(userRepository.existsByEmailAndDeletedAtIsNull(EMAIL)).thenReturn(false);
        when(userRepository.existsByUsernameAndDeletedAtIsNull("buyer01")).thenReturn(true);

        DuplicateResourceException exception = assertThrows(DuplicateResourceException.class,
                () -> authService.register(registerRequest()));

        assertEquals(ErrorCode.CONFLICT, exception.getErrorCode());
        assertTrue(exception.getMessage().contains("buyer01"));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("FR-01: không cho tự đăng ký vai trò ADMIN")
    void register_vaiTroAdmin_biTuChoi() {
        RegisterRequest request = new RegisterRequest(EMAIL, "buyer01", PASSWORD, "Nguyễn Văn A", null,
                RoleService.ROLE_ADMIN);

        BusinessException exception = assertThrows(BusinessException.class, () -> authService.register(request));

        assertEquals(ErrorCode.BAD_REQUEST, exception.getErrorCode());
        verifyNoInteractions(userRepository);
    }

    @Test
    @DisplayName("FR-01: đăng ký hợp lệ → tạo tài khoản ACTIVE, băm mật khẩu và gán vai trò")
    void register_hopLe_taoTaiKhoanVaGanVaiTro() {
        UUID roleId = UUID.randomUUID();
        Role buyerRole = Role.builder().id(roleId).code(RoleService.ROLE_BUYER).name("Người mua").build();

        when(userRepository.existsByEmailAndDeletedAtIsNull(EMAIL)).thenReturn(false);
        when(userRepository.existsByUsernameAndDeletedAtIsNull("buyer01")).thenReturn(false);
        when(roleService.getByCode(RoleService.ROLE_BUYER)).thenReturn(buyerRole);
        when(passwordEncoder.encode(PASSWORD)).thenReturn(PASSWORD_HASH);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User entity = invocation.getArgument(0);
            entity.setId(UUID.randomUUID());
            return entity;
        });
        when(userRoleRepository.save(any(UserRole.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = authService.register(registerRequest());

        assertNotNull(response.id());
        assertEquals(EMAIL, response.email());
        assertEquals("buyer01", response.username());
        assertEquals(UserStatus.ACTIVE, response.status());
        assertEquals(List.of(RoleService.ROLE_BUYER), response.roles());
        verify(userRoleRepository).save(any(UserRole.class));
    }

    @Test
    @DisplayName("FR-02: đăng nhập sai mật khẩu → UNAUTHORIZED với thông báo chung")
    void login_saiMatKhau_nemUnauthorized() {
        when(userRepository.findByEmailAndDeletedAtIsNull(EMAIL))
                .thenReturn(Optional.of(existingUser(UserStatus.ACTIVE)));
        when(passwordEncoder.matches(PASSWORD, PASSWORD_HASH)).thenReturn(false);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> authService.login(new LoginRequest(EMAIL, PASSWORD)));

        assertEquals(ErrorCode.UNAUTHORIZED, exception.getErrorCode());
        assertEquals("Email hoặc mật khẩu không đúng", exception.getMessage());
        verifyNoInteractions(tokenService);
    }

    @Test
    @DisplayName("FR-02: đăng nhập với email không tồn tại → UNAUTHORIZED (không tiết lộ tài khoản)")
    void login_emailKhongTonTai_nemUnauthorized() {
        when(userRepository.findByEmailAndDeletedAtIsNull(EMAIL)).thenReturn(Optional.empty());

        BusinessException exception = assertThrows(BusinessException.class,
                () -> authService.login(new LoginRequest(EMAIL, PASSWORD)));

        assertEquals(ErrorCode.UNAUTHORIZED, exception.getErrorCode());
        verifyNoInteractions(passwordEncoder, tokenService);
    }

    @Test
    @DisplayName("FR-02: đăng nhập khi tài khoản INACTIVE → từ chối (FORBIDDEN), không cấp token")
    void login_taiKhoanInactive_biTuChoi() {
        when(userRepository.findByEmailAndDeletedAtIsNull(EMAIL))
                .thenReturn(Optional.of(existingUser(UserStatus.INACTIVE)));
        when(passwordEncoder.matches(PASSWORD, PASSWORD_HASH)).thenReturn(true);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> authService.login(new LoginRequest(EMAIL, PASSWORD)));

        assertEquals(ErrorCode.FORBIDDEN, exception.getErrorCode());
        assertTrue(exception.getMessage().contains("Tài khoản"));
        verifyNoInteractions(tokenService);
    }

    @Test
    @DisplayName("FR-02: đăng nhập hợp lệ → sinh token kèm vai trò, ttl dùng cho expiresIn")
    void login_hopLe_traVeToken() {
        User user = existingUser(UserStatus.ACTIVE);
        UUID userId = user.getId();
        List<String> roles = List.of(RoleService.ROLE_BUYER);

        when(userRepository.findByEmailAndDeletedAtIsNull(EMAIL)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(PASSWORD, PASSWORD_HASH)).thenReturn(true);
        when(roleService.findRoleCodesOfUser(userId)).thenReturn(roles);
        when(tokenService.generate(userId, EMAIL, roles)).thenReturn("token-demo");
        when(tokenService.ttlSeconds()).thenReturn(28800L);

        AuthResponse response = authService.login(new LoginRequest(EMAIL, PASSWORD));

        assertEquals("token-demo", response.accessToken());
        assertEquals("Bearer", response.tokenType());
        assertEquals(28800L, response.expiresIn());
        assertEquals(userId, response.user().id());
        assertEquals(roles, response.user().roles());
    }

    @Test
    @DisplayName("FR-02: /auth/me với tài khoản đã bị khoá → FORBIDDEN")
    void getCurrentUser_taiKhoanBiKhoa_biTuChoi() {
        User user = existingUser(UserStatus.BANNED);
        when(userRepository.findByIdAndDeletedAtIsNull(user.getId())).thenReturn(Optional.of(user));

        BusinessException exception = assertThrows(BusinessException.class,
                () -> authService.getCurrentUser(user.getId()));

        assertEquals(ErrorCode.FORBIDDEN, exception.getErrorCode());
    }

    @Test
    @DisplayName("FR-02: /auth/me trả thông tin người dùng hiện tại kèm vai trò")
    void getCurrentUser_hopLe_traVeThongTin() {
        User user = existingUser(UserStatus.ACTIVE);
        when(userRepository.findByIdAndDeletedAtIsNull(user.getId())).thenReturn(Optional.of(user));
        when(roleService.findRoleCodesOfUser(user.getId())).thenReturn(List.of(RoleService.ROLE_BUYER));

        UserResponse response = authService.getCurrentUser(user.getId());

        assertEquals(user.getId(), response.id());
        assertEquals(EMAIL, response.email());
        assertEquals(List.of(RoleService.ROLE_BUYER), response.roles());
    }

    @Test
    @DisplayName("FR-02: đăng xuất là no-op phía server (stateless)")
    void logout_khongNemLoi() {
        authService.logout();

        verifyNoInteractions(userRepository, userRoleRepository, roleService, passwordEncoder, tokenService);
    }

    @Test
    @DisplayName("FR-01: mật khẩu thô không bao giờ được lưu (chỉ lưu bản băm)")
    void register_luuMatKhauDaBam() {
        Role buyerRole = Role.builder().id(UUID.randomUUID()).code(RoleService.ROLE_BUYER).name("Người mua").build();

        when(userRepository.existsByEmailAndDeletedAtIsNull(anyString())).thenReturn(false);
        when(userRepository.existsByUsernameAndDeletedAtIsNull(anyString())).thenReturn(false);
        when(roleService.getByCode(RoleService.ROLE_BUYER)).thenReturn(buyerRole);
        when(passwordEncoder.encode(PASSWORD)).thenReturn(PASSWORD_HASH);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userRoleRepository.save(any(UserRole.class))).thenAnswer(invocation -> invocation.getArgument(0));

        authService.register(registerRequest());

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertEquals(PASSWORD_HASH, captor.getValue().getPasswordHash());
        assertTrue(!PASSWORD.equals(captor.getValue().getPasswordHash()),
                "Không được lưu mật khẩu thô");
    }
}
