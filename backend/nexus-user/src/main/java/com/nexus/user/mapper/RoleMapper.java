package com.nexus.user.mapper;

import com.nexus.user.entity.Role;
import com.nexus.user.entity.UserRole;

import java.util.Collection;
import java.util.Comparator;
import java.util.List;

/**
 * Chuyển {@link Role}/{@link UserRole} → mã vai trò. Viết tay, static, final class (§9).
 * <p>
 * Vai trò được dùng dưới dạng mã chuỗi (BUYER/SELLER/ADMIN) cho token và DTO,
 * nên mapper chỉ cần trích xuất mã — không có DTO Role riêng trong phạm vi FR-01–04/52.
 */
public final class RoleMapper {

    private RoleMapper() {
    }

    public static String toCode(Role role) {
        return role == null ? null : role.getCode();
    }

    /** Mã vai trò của một danh sách entity Role. */
    public static List<String> toCodes(Collection<Role> roles) {
        if (roles == null || roles.isEmpty()) {
            return List.of();
        }
        return roles.stream()
                .filter(role -> role != null && role.getCode() != null)
                .map(role -> role.getCode())
                .sorted(Comparator.naturalOrder())
                .toList();
    }

    /**
     * Mã vai trò của một tập bản gán {@code user_roles} (đã join fetch {@code role}).
     * Đây là cách duy nhất module này đọc vai trò của người dùng — {@code User} không có
     * {@code @OneToMany} sang {@code UserRole}.
     */
    public static List<String> toCodesFromAssignments(Collection<UserRole> assignments) {
        if (assignments == null || assignments.isEmpty()) {
            return List.of();
        }
        return assignments.stream()
                .filter(assignment -> assignment != null && assignment.getRole() != null)
                .map(assignment -> assignment.getRole().getCode())
                .filter(code -> code != null)
                .sorted(Comparator.naturalOrder())
                .toList();
    }
}
