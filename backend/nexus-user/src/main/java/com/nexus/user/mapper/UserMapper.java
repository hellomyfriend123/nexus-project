package com.nexus.user.mapper;

import com.nexus.user.dto.admin.AdminUserResponse;
import com.nexus.user.dto.admin.AdminUserSummaryResponse;
import com.nexus.user.dto.buyer.ProfileResponse;
import com.nexus.user.dto.common.UserResponse;
import com.nexus.user.entity.User;

import java.util.List;

/**
 * Chuyển {@link User} → DTO. Viết tay, static, final class (KHÔNG dùng MapStruct/reflection — §9).
 * <p>
 * Mọi method đều nhận sẵn danh sách mã vai trò để mapper không phải chạm vào repository.
 */
public final class UserMapper {

    private UserMapper() {
    }

    /** FR-01/FR-02 — danh tính người dùng trả cho client. */
    public static UserResponse toResponse(User user, List<String> roles) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getFullName(),
                user.getPhone(),
                user.getGender(),
                user.getStatus(),
                safeRoles(roles),
                user.getCreatedAt());
    }

    /** FR-03 — hồ sơ đầy đủ của chính người dùng đang đăng nhập. */
    public static ProfileResponse toProfileResponse(User user) {
        return new ProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getFullName(),
                user.getPhone(),
                user.getAddress(),
                user.getDateOfBirth(),
                user.getGender(),
                user.getStatus(),
                user.getCreatedAt(),
                user.getUpdatedAt());
    }

    /** FR-04/FR-52 — chi tiết người dùng cho Admin. */
    public static AdminUserResponse toAdminResponse(User user, List<String> roles) {
        return new AdminUserResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getFullName(),
                user.getPhone(),
                user.getIdentityNumber(),
                user.getAddress(),
                user.getDateOfBirth(),
                user.getGender(),
                user.getStatus(),
                safeRoles(roles),
                user.getCreatedAt(),
                user.getUpdatedAt());
    }

    /** FR-04/FR-52 — một dòng trong danh sách người dùng của Admin. */
    public static AdminUserSummaryResponse toAdminSummary(User user, List<String> roles) {
        return new AdminUserSummaryResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getFullName(),
                user.getStatus(),
                safeRoles(roles),
                user.getCreatedAt());
    }

    /** Không bao giờ trả {@code null} cho danh sách vai trò để JSON luôn có mảng. */
    private static List<String> safeRoles(List<String> roles) {
        return roles == null ? List.of() : List.copyOf(roles);
    }
}
