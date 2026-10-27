package com.nexus.user.seed;

import com.nexus.user.entity.Role;
import com.nexus.user.entity.User;
import com.nexus.user.entity.UserRole;
import com.nexus.user.entity.UserRoleId;
import com.nexus.user.enums.UserStatus;
import com.nexus.user.repository.RoleRepository;
import com.nexus.user.repository.UserRepository;
import com.nexus.user.repository.UserRoleRepository;
import com.nexus.user.service.RoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Seed dữ liệu tối thiểu cho module người dùng (chạy lúc khởi động).
 * <p>
 * <b>Idempotent</b> — chạy lại nhiều lần không tạo bản ghi trùng và không ném lỗi:
 * <ol>
 *   <li>Tạo 3 vai trò chuẩn BUYER / SELLER / ADMIN nếu chưa có (cần trước để FR-01 gán được vai trò).</li>
 *   <li>Tạo tài khoản ADMIN demo nếu hệ thống chưa có tài khoản admin nào.</li>
 * </ol>
 * Chạy được trên database trống (Hibernate tạo bảng trước khi {@code CommandLineRunner} thực thi).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RoleAndAdminSeeder implements CommandLineRunner {

    /** Tài khoản quản trị demo — CHỈ dùng cho môi trường phát triển/demo. */
    public static final String ADMIN_EMAIL = "admin@nexus.local";
    public static final String ADMIN_USERNAME = "admin";
    public static final String ADMIN_DEMO_PASSWORD = "Admin@123";

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        Role buyerRole = ensureRole(RoleService.ROLE_BUYER, "Người mua",
                "Tài khoản mua hàng, đặt hàng và đấu giá (FR-01)");
        Role sellerRole = ensureRole(RoleService.ROLE_SELLER, "Người bán",
                "Tài khoản bán hàng, quản lý sản phẩm và đơn hàng (FR-01)");
        Role adminRole = ensureRole(RoleService.ROLE_ADMIN, "Quản trị viên",
                "Tài khoản quản trị hệ thống (FR-04, FR-52)");

        log.debug("Vai trò sẵn sàng: {}, {}, {}", buyerRole.getCode(), sellerRole.getCode(), adminRole.getCode());
        ensureAdminAccount(adminRole);
    }

    /** Tạo vai trò nếu chưa có; đã có thì dùng lại (không ghi đè tên/mô tả đã chỉnh tay). */
    private Role ensureRole(String code, String name, String description) {
        return roleRepository.findByCode(code).orElseGet(() -> {
            Role created = roleRepository.save(Role.builder()
                    .code(code)
                    .name(name)
                    .description(description)
                    .build());
            log.info("Đã tạo vai trò {} ({})", code, name);
            return created;
        });
    }

    /**
     * Tạo tài khoản ADMIN demo khi hệ thống chưa có admin nào.
     * <p>
     * Nếu email hoặc username đã bị người dùng khác chiếm, bỏ qua và ghi cảnh báo
     * thay vì làm ứng dụng khởi động thất bại.
     */
    private void ensureAdminAccount(Role adminRole) {
        if (userRepository.findByEmailAndDeletedAtIsNull(ADMIN_EMAIL).isPresent()) {
            log.debug("Tài khoản quản trị {} đã tồn tại — bỏ qua bước seed", ADMIN_EMAIL);
            return;
        }
        if (userRepository.findByUsernameAndDeletedAtIsNull(ADMIN_USERNAME).isPresent()) {
            log.warn("Không tạo được tài khoản quản trị demo vì tên đăng nhập '{}' đã được sử dụng",
                    ADMIN_USERNAME);
            return;
        }

        User admin = userRepository.save(User.builder()
                .email(ADMIN_EMAIL)
                .username(ADMIN_USERNAME)
                .passwordHash(passwordEncoder.encode(ADMIN_DEMO_PASSWORD))
                .fullName("Quản trị viên Nexus")
                .status(UserStatus.ACTIVE)
                .build());

        userRoleRepository.save(UserRole.builder()
                .id(new UserRoleId(admin.getId(), adminRole.getId()))
                .user(admin)
                .role(adminRole)
                .assignedAt(Instant.now())
                .build());

        log.warn("Đã tạo TÀI KHOẢN DEMO (chỉ dùng cho phát triển/demo, hãy đổi mật khẩu trước khi triển khai): "
                + "email={} | mật khẩu demo={}", ADMIN_EMAIL, ADMIN_DEMO_PASSWORD);
    }
}
