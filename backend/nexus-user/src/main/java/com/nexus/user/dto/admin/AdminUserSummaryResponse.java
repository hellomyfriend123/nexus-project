package com.nexus.user.dto.admin;

import com.nexus.user.enums.UserStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Dòng người dùng trong danh sách phân trang của Admin (FR-04, FR-52)
 * — {@code GET /api/v1/admin/users?keyword=&status=&role=&page=&size=}.
 * <p>
 * Rút gọn so với {@link AdminUserResponse} để trang danh sách nhẹ và dễ đọc.
 */
public record AdminUserSummaryResponse(
        UUID id,
        String email,
        String username,
        String fullName,
        UserStatus status,
        List<String> roles,
        Instant createdAt
) {
}
