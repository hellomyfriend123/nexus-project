package com.nexus.user.dto.admin;

import com.nexus.user.enums.Gender;
import com.nexus.user.enums.UserStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Chi tiết người dùng cho Admin (FR-04, FR-52) — {@code GET /api/v1/admin/users/{id}}.
 * <p>
 * Có thêm {@code identityNumber} so với hồ sơ thường vì Admin cần đối soát danh tính.
 * KHÔNG chứa {@code passwordHash} và {@code deletedAt}.
 */
public record AdminUserResponse(
        UUID id,
        String email,
        String username,
        String fullName,
        String phone,
        String identityNumber,
        String address,
        LocalDate dateOfBirth,
        Gender gender,
        UserStatus status,
        List<String> roles,
        Instant createdAt,
        Instant updatedAt
) {
}
