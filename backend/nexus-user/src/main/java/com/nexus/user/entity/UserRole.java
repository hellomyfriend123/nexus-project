package com.nexus.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Gán vai trò cho người dùng — bảng {@code nexus_user.user_roles} (FR-01, FR-04).
 * <p>
 * Đây là bảng nối có khoá ghép nên <b>không</b> kế thừa {@code BaseEntity} (theo §4 CONVENTIONS).
 * Quan hệ {@code @ManyToOne} chỉ trỏ tới entity <b>cùng module</b> (User, Role) — hợp lệ theo §4.
 * <p>
 * Phía {@code User} cố tình KHÔNG có {@code @OneToMany} sang bảng này: muốn biết vai trò của một
 * người dùng thì gọi {@code UserRoleRepository} (tránh lazy collection và N+1 ngoài ý muốn).
 */
@Entity
@Table(name = "user_roles", schema = "nexus_user")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRole {

    @EmbeddedId
    private UserRoleId id;

    /** Khoá ghép được suy ra từ liên kết này ({@code user_id}). */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("userId")
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Khoá ghép được suy ra từ liên kết này ({@code role_id}). */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("roleId")
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt;

    /**
     * Bảo đảm khoá ghép luôn đồng bộ với hai liên kết trước khi INSERT
     * — tránh lỗi "identifier must not be null" khi tạo bản gán vai trò.
     */
    @PrePersist
    void syncIdFromAssociations() {
        if (id == null) {
            id = new UserRoleId();
        }
        if (user != null) {
            id.setUserId(user.getId());
        }
        if (role != null) {
            id.setRoleId(role.getId());
        }
        if (assignedAt == null) {
            assignedAt = Instant.now();
        }
    }
}
