package com.nexus.user.controller.admin;

import com.nexus.common.api.PageResponse;
import com.nexus.common.security.SecurityUtils;
import com.nexus.user.dto.admin.AdminUserResponse;
import com.nexus.user.dto.admin.AdminUserSummaryResponse;
import com.nexus.user.dto.admin.UpdateUserStatusRequest;
import com.nexus.user.enums.UserStatus;
import com.nexus.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * FR-04 &amp; FR-52 — Admin quản lý tài khoản người dùng.
 * <p>
 * Danh sách dùng {@code Pageable} chuẩn của Spring ({@code page}, {@code size}, {@code sort})
 * và trả {@link PageResponse} (KHÔNG trả {@code Page<T>} trực tiếp — §7 CONVENTIONS).
 */
@RestController
@RequestMapping("/api/v1/admin/users")
@Tag(name = "User — Admin", description = "FR-04, FR-52 (quản lý tài khoản người dùng)")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "FR-04, FR-52 — Admin tìm kiếm và phân trang người dùng")
    public ResponseEntity<PageResponse<AdminUserSummaryResponse>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) String role,
            Pageable pageable) {
        return ResponseEntity.ok(userService.searchUsers(keyword, status, role, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "FR-04 — Admin xem chi tiết một người dùng")
    public ResponseEntity<AdminUserResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getUser(id));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "FR-04 — Admin kích hoạt / vô hiệu hoá / khoá tài khoản người dùng")
    public ResponseEntity<AdminUserResponse> updateStatus(@PathVariable UUID id,
                                                          @Valid @RequestBody UpdateUserStatusRequest request) {
        // Người thực hiện lấy từ token: service cần biết để chặn Admin tự khoá chính mình
        UUID currentAdminId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(userService.updateStatus(currentAdminId, id, request.status()));
    }
}
