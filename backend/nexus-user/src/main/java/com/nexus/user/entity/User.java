package com.nexus.user.entity;

import com.nexus.common.entity.BaseEntity;
import com.nexus.user.enums.Gender;
import com.nexus.user.enums.UserStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Người dùng hệ thống — bảng {@code nexus_user.users} (FR-01, FR-02, FR-03, FR-04, FR-52).
 * <p>
 * Quy ước:
 * <ul>
 *   <li>Kế thừa {@link BaseEntity} → có sẵn {@code id}, {@code createdAt}, {@code updatedAt}.</li>
 *   <li>{@code email} và {@code username} là duy nhất (đã kiểm tra ở tầng service bằng
 *       {@code DuplicateResourceException} trước khi ghi DB).</li>
 *   <li>Soft delete bằng {@code deletedAt} — mọi truy vấn của repository phải lọc
 *       {@code deletedAt IS NULL}.</li>
 *   <li>CỐ TÌNH không khai báo {@code @OneToMany} tới {@code UserRole}: lấy vai trò qua
 *       {@code UserRoleRepository} để tránh lazy-loading phức tạp ngoài transaction.</li>
 * </ul>
 */
@Entity
@Table(name = "users", schema = "nexus_user",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_users_email", columnNames = "email"),
                @UniqueConstraint(name = "uk_users_username", columnNames = "username")
        })
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity {

    /** Email đăng nhập — duy nhất, luôn lưu ở dạng chữ thường. */
    @Column(name = "email", nullable = false, length = 255)
    private String email;

    /** Tên đăng nhập — duy nhất. */
    @Column(name = "username", nullable = false, length = 50)
    private String username;

    /** Mật khẩu đã băm bằng BCrypt — KHÔNG bao giờ trả ra REST. */
    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "phone", length = 20)
    private String phone;

    /** Số CMND/CCCD — chỉ Admin xem được (FR-04, FR-52). */
    @Column(name = "identity_number", length = 50)
    private String identityNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", length = 20)
    private Gender gender;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private UserStatus status;

    /** Soft delete: khác null nghĩa là tài khoản đã bị xoá mềm, không được đăng nhập. */
    @Column(name = "deleted_at")
    private Instant deletedAt;
}
