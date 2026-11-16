package com.nexus.user.dto.admin;

import com.nexus.user.enums.UserStatus;
import jakarta.validation.constraints.NotNull;

/**
 * Yêu cầu đổi trạng thái tài khoản (FR-04) — {@code PATCH /api/v1/admin/users/{id}/status}.
 * <p>
 * Dùng chung cho cả kích hoạt ({@code ACTIVE}) lẫn vô hiệu hoá ({@code INACTIVE}/{@code BANNED}).
 */
public record UpdateUserStatusRequest(

        @NotNull(message = "Trạng thái không được để trống")
        UserStatus status
) {
}
