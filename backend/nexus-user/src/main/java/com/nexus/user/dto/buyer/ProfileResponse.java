package com.nexus.user.dto.buyer;

import com.nexus.user.enums.Gender;
import com.nexus.user.enums.UserStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Hồ sơ đầy đủ của người dùng (FR-03) — dùng cho cả Buyer và Seller vì cấu trúc hồ sơ giống hệt nhau
 * (cùng một bảng {@code users}); Seller tái sử dụng DTO này thay vì nhân bản.
 * <p>
 * KHÔNG chứa {@code passwordHash}, {@code deletedAt}, {@code version} hay vai trò
 * (vai trò đã có trong token và trong {@code UserResponse} của FR-02).
 */
public record ProfileResponse(
        UUID id,
        String email,
        String username,
        String fullName,
        String phone,
        String address,
        LocalDate dateOfBirth,
        Gender gender,
        UserStatus status,
        Instant createdAt,
        Instant updatedAt
) {
}
