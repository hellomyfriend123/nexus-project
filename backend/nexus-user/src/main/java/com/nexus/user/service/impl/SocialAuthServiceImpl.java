package com.nexus.user.service.impl;

import com.nexus.common.api.ErrorCode;
import com.nexus.common.exception.BusinessException;
import com.nexus.common.security.SocialLoginHandler;
import com.nexus.common.security.SocialLoginResult;
import com.nexus.common.security.TokenService;
import com.nexus.user.entity.Role;
import com.nexus.user.entity.User;
import com.nexus.user.entity.UserRole;
import com.nexus.user.entity.UserRoleId;
import com.nexus.user.enums.UserStatus;
import com.nexus.user.repository.UserRepository;
import com.nexus.user.repository.UserRoleRepository;
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
 * Cài đặt {@link SocialLoginHandler} — đăng nhập bằng Google (FR-02, mở rộng).
 * <p>
 * <b>Quyết định thiết kế quan trọng:</b> tài khoản Google được ánh xạ vào
 * {@code nexus_user.users} theo <b>email đã xác thực</b>, KHÔNG thêm cột
 * {@code provider}/{@code provider_id}. Lý do:
 * <ul>
 *   <li>Google luôn trả {@code email_verified=true} với tài khoản Gmail, nên email là định danh
 *       đủ tin cậy và không thể trùng giữa hai người.</li>
 *   <li>Không đổi lược đồ DB nghĩa là {@code db/01-user.sql} và mọi truy vấn hiện có vẫn đúng,
 *       không cần migration mới, không rủi ro với dữ liệu đang có trên Supabase.</li>
 *   <li>Người dùng đăng ký bằng mật khẩu rồi sau đó đăng nhập bằng Google <b>cùng email</b>
 *       sẽ vào đúng tài khoản cũ — đúng ý người dùng, không tạo tài khoản trùng.</li>
 * </ul>
 * Cột {@code password_hash} là {@code NOT NULL}, nên tài khoản tạo từ Google được gán một
 * mật khẩu <b>ngẫu nhiên 64 ký tự</b> đã băm BCrypt. Không ai biết mật khẩu này, nghĩa là
 * không thể đăng nhập bằng mật khẩu vào tài khoản Google-only; nếu sau này người dùng muốn
 * đặt mật khẩu thật thì dùng luồng "quên mật khẩu" để ghi đè.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SocialAuthServiceImpl implements SocialLoginHandler {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleService roleService;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    @Override
    @Transactional
    public SocialLoginResult authenticate(String provider,
                                          String subject,
                                          String email,
                                          String fullName,
                                          boolean emailVerified,
                                          String requestedRole) {

        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Nhà cung cấp không trả về email nên không thể tạo tài khoản");
        }
        if (!emailVerified) {
            // Nhận email chưa xác thực sẽ cho phép kẻ tấn công chiếm tài khoản của người khác
            // bằng cách tạo tài khoản Google mang email đó.
            throw new BusinessException(ErrorCode.UNAUTHORIZED,
                    "Email của tài khoản Google chưa được xác thực nên không thể đăng nhập");
        }

        return userRepository.findByEmailAndDeletedAtIsNull(normalizedEmail)
                .map(existing -> loginExisting(existing, provider))
                .orElseGet(() -> createNew(normalizedEmail, fullName, requestedRole, provider, subject));
    }

    /** Tài khoản đã có: chỉ kiểm tra trạng thái rồi cấp token, KHÔNG đổi vai trò trong DB. */
    private SocialLoginResult loginExisting(User user, String provider) {
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BusinessException(ErrorCode.FORBIDDEN,
                    "Tài khoản " + describe(user.getStatus()) + " nên không thể đăng nhập");
        }
        List<String> roles = roleService.findRoleCodesOfUser(user.getId());
        String token = tokenService.generate(user.getId(), user.getEmail(), roles);

        log.info("Đăng nhập {} thành công (tài khoản có sẵn): {} (vai trò: {})",
                provider, user.getEmail(), roles);
        return new SocialLoginResult(token, tokenService.ttlSeconds(), user.getId(),
                user.getEmail(), user.getFullName(), roles, false);
    }

    /** Tài khoản mới: tạo user + gán vai trò + cấp token, trong cùng một transaction. */
    private SocialLoginResult createNew(String email,
                                        String fullName,
                                        String requestedRole,
                                        String provider,
                                        String subject) {

        String roleCode = sanitizeRole(requestedRole);
        Role role = roleService.getByCode(roleCode);

        User user = User.builder()
                .email(email)
                .username(nextAvailableUsername(email))
                .passwordHash(randomPasswordHash())
                .fullName(sanitizeFullName(fullName, email))
                // Tài khoản tạo từ Google không có số điện thoại/địa chỉ — để trống, người dùng
                // bổ sung sau ở FR-03 (cập nhật hồ sơ).
                .status(UserStatus.ACTIVE)
                .build();
        User saved = userRepository.save(user);

        userRoleRepository.save(UserRole.builder()
                .id(new UserRoleId(saved.getId(), role.getId()))
                .user(saved)
                .role(role)
                .assignedAt(Instant.now())
                .build());

        List<String> roles = List.of(role.getCode());
        String token = tokenService.generate(saved.getId(), saved.getEmail(), roles);

        log.info("Tạo tài khoản mới từ {}: {} (sub={}, vai trò: {})",
                provider, saved.getEmail(), subject, roles);
        return new SocialLoginResult(token, tokenService.ttlSeconds(), saved.getId(),
                saved.getEmail(), saved.getFullName(), roles, true);
    }

    /**
     * Mật khẩu ngẫu nhiên không ai biết — chỉ để thoả ràng buộc {@code password_hash NOT NULL}.
     * Dùng {@link UUID#randomUUID()} (nguồn ngẫu nhiên mật mã của hệ điều hành) làm nguyên liệu.
     */
    private String randomPasswordHash() {
        String random = UUID.randomUUID() + "-" + UUID.randomUUID();
        return passwordEncoder.encode(random);
    }

    /**
     * Sinh {@code username} duy nhất từ phần trước {@code @} của email.
     * Ví dụ {@code nguyen.van.a@gmail.com} → {@code nguyen.van.a}, trùng thì thêm số đuôi.
     */
    private String nextAvailableUsername(String email) {
        String base = email.substring(0, email.indexOf('@'))
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9._-]", "");
        if (base.length() < 3) {
            base = "user" + base;
        }
        if (base.length() > 40) {
            base = base.substring(0, 40);
        }

        String candidate = base;
        int suffix = 1;
        // Giới hạn vòng lặp để không treo nếu dữ liệu bất thường; 9999 là quá đủ.
        while (userRepository.existsByUsernameAndDeletedAtIsNull(candidate)) {
            suffix++;
            if (suffix > 9999) {
                throw new BusinessException(ErrorCode.CONFLICT,
                        "Không sinh được tên đăng nhập duy nhất từ email " + email);
            }
            candidate = base + suffix;
        }
        return candidate;
    }

    /** Google có thể không trả {@code name} — rơi về phần trước {@code @} của email. */
    private static String sanitizeFullName(String fullName, String email) {
        String value = fullName == null ? "" : fullName.trim();
        if (value.isEmpty()) {
            value = email.substring(0, email.indexOf('@'));
        }
        return value.length() > 150 ? value.substring(0, 150) : value;
    }

    /** Chỉ BUYER/SELLER được tự chọn; giá trị lạ rơi về BUYER (quyền thấp nhất). */
    private static String sanitizeRole(String requestedRole) {
        if (requestedRole == null) {
            return RoleService.ROLE_BUYER;
        }
        String upper = requestedRole.trim().toUpperCase(Locale.ROOT);
        return RoleService.ROLE_SELLER.equals(upper) ? RoleService.ROLE_SELLER : RoleService.ROLE_BUYER;
    }

    private static String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        String trimmed = email.trim().toLowerCase(Locale.ROOT);
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String describe(UserStatus status) {
        return switch (status) {
            case ACTIVE -> "đang hoạt động";
            case INACTIVE -> "đã bị vô hiệu hoá";
            case BANNED -> "đã bị khoá";
        };
    }
}
