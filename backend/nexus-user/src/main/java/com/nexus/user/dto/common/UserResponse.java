package com.nexus.user.dto.common;

import com.nexus.user.enums.Gender;
import com.nexus.user.enums.UserStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Danh tính người dùng trả cho client (FR-01, FR-02) — dùng cho đăng ký, đăng nhập và {@code /auth/me}.
 * <p>
 * DTO dùng chung cho cả 3 vai trò nên đặt ở {@code dto/common} (theo §6 CONVENTIONS).
 * <b>Không</b> chứa {@code passwordHash}, {@code deletedAt}, {@code version}.
 * Hồ sơ đầy đủ (địa chỉ, ngày sinh...) nằm ở {@code ProfileResponse} của FR-03.
 */
public record UserResponse(
        UUID id,
        String email,
        String username,
        String fullName,
        String phone,
        Gender gender,
        UserStatus status,
        List<String> roles,
        Instant createdAt
) {
}
