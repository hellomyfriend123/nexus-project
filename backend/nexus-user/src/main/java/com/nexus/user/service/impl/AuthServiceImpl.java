package com.nexus.user.service.impl;

import com.nexus.common.api.ErrorCode;
import com.nexus.common.exception.BusinessException;
import com.nexus.common.exception.DuplicateResourceException;
import com.nexus.common.exception.ResourceNotFoundException;
import com.nexus.common.security.TokenService;
import com.nexus.user.dto.common.UserResponse;
import com.nexus.user.dto.publicapi.AuthResponse;
import com.nexus.user.dto.publicapi.LoginRequest;
import com.nexus.user.dto.publicapi.RegisterRequest;
import com.nexus.user.entity.Role;
import com.nexus.user.entity.User;
import com.nexus.user.entity.UserRole;
import com.nexus.user.entity.UserRoleId;
import com.nexus.user.enums.UserStatus;
import com.nexus.user.mapper.UserMapper;
import com.nexus.user.repository.UserRepository;
import com.nexus.user.repository.UserRoleRepository;
import com.nexus.user.service.AuthService;
import com.nexus.user.service.RoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Cài đặt {@link AuthService} — FR-01 (đăng ký) và FR-02 (đăng nhập / đăng xuất / thông tin hiện tại).
 * <p>
 * Nguyên tắc bảo mật:
 * <ul>
 *   <li>Mật khẩu chỉ được lưu dưới dạng băm BCrypt ({@link PasswordEncoder} của {@code nexus-common}).</li>
 *   <li>Sai email và sai mật khẩu trả về cùng một thông báo → không tiết lộ tài khoản nào tồn tại.</li>
 *   <li>Kiểm tra mật khẩu TRƯỚC khi kiểm tra trạng thái tài khoản → không tiết lộ trạng thái
 *       cho người không biết mật khẩu.</li>
 *   <li>Token do {@code TokenService} sinh, chứa userId + email + vai trò.</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleService roleService;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    @Override
    @Transactional
    public UserResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        String username = request.username().trim();
        String roleCode = request.role().trim().toUpperCase(Locale.ROOT);

        // Phòng thủ nhiều lớp: DTO đã chặn bằng @Pattern, service kiểm tra lại để không phụ thuộc tầng web
        if (!RoleService.ROLE_BUYER.equals(roleCode) && !RoleService.ROLE_SELLER.equals(roleCode)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Chỉ được đăng ký với vai trò BUYER hoặc SELLER");
        }

        if (userRepository.existsByEmailAndDeletedAtIsNull(email)) {
            throw new DuplicateResourceException("Người dùng", "email", email);
        }
        if (userRepository.existsByUsernameAndDeletedAtIsNull(username)) {
            throw new DuplicateResourceException("Người dùng", "username", username);
        }

        Role role = roleService.getByCode(roleCode);

        User user = User.builder()
                .email(email)
                .username(username)
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName().trim())
                .phone(trimToNull(request.phone()))
                .status(UserStatus.ACTIVE)
                .build();
        User saved = userRepository.save(user);

        userRoleRepository.save(UserRole.builder()
                .id(new UserRoleId(saved.getId(), role.getId()))
                .user(saved)
                .role(role)
                .assignedAt(Instant.now())
                .build());

        log.info("Đăng ký thành công tài khoản {} với vai trò {}", email, roleCode);
        return UserMapper.toResponse(saved, List.of(role.getCode()));
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());

        User user = userRepository.findByEmailAndDeletedAtIsNull(email)
                .orElseThrow(AuthServiceImpl::badCredentials);

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw badCredentials();
        }
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.FORBIDDEN,
                    "Tài khoản " + describe(user.getStatus()) + " nên không thể đăng nhập");
        }

        List<String> roles = roleService.findRoleCodesOfUser(user.getId());
        String accessToken = tokenService.generate(user.getId(), user.getEmail(), roles);

        log.info("Đăng nhập thành công: {} (vai trò: {})", user.getEmail(), roles);
        return AuthResponse.of(accessToken, tokenService.ttlSeconds(), UserMapper.toResponse(user, roles));
    }

    @Override
    public void logout() {
        // Hệ thống chạy stateless (xem SecurityConfig: SessionCreationPolicy.STATELESS) nên server
        // KHÔNG giữ phiên đăng nhập: client chỉ cần xoá token đang giữ.
        // Endpoint này tồn tại để đủ hợp đồng FR-02 và là điểm mở rộng sau này
        // (ví dụ: danh sách đen token trong Redis/bảng revoked_tokens, thu hồi theo thiết bị).
        log.debug("Đăng xuất (stateless) — không cần thao tác phía server");
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(UUID userId) {
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Người dùng", userId));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.FORBIDDEN,
                    "Tài khoản " + describe(user.getStatus()) + " nên không thể truy cập");
        }

        return UserMapper.toResponse(user, roleService.findRoleCodesOfUser(userId));
    }

    /** Email là duy nhất và không phân biệt hoa thường → luôn lưu/tra cứu ở dạng chữ thường. */
    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static BusinessException badCredentials() {
        return new BusinessException(ErrorCode.UNAUTHORIZED, "Email hoặc mật khẩu không đúng");
    }

    private static String describe(UserStatus status) {
        return switch (status) {
            case ACTIVE -> "đang hoạt động";
            case INACTIVE -> "đã bị vô hiệu hoá";
            case BANNED -> "đã bị khoá";
        };
    }
}
