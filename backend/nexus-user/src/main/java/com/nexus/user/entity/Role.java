package com.nexus.user.entity;

import com.nexus.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * Vai trò hệ thống — bảng {@code nexus_user.roles} (FR-01, FR-04).
 * <p>
 * Ba vai trò chuẩn: {@code BUYER}, {@code SELLER}, {@code ADMIN}
 * (xem hằng số trong {@code com.nexus.user.service.RoleService}).
 * Bảng này KHÔNG có soft delete: vai trò là dữ liệu cấu hình, chỉ được seed một lần.
 */
@Entity
@Table(name = "roles", schema = "nexus_user",
        uniqueConstraints = @UniqueConstraint(name = "uk_roles_code", columnNames = "code"))
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Role extends BaseEntity {

    /** Mã vai trò: BUYER / SELLER / ADMIN. */
    @Column(name = "code", nullable = false, length = 30)
    private String code;

    /** Tên hiển thị, ví dụ "Người mua". */
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", length = 255)
    private String description;
}
