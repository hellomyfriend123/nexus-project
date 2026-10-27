package com.nexus.user.controller.seller;

import com.nexus.common.security.SecurityUtils;
import com.nexus.user.dto.buyer.ProfileResponse;
import com.nexus.user.dto.buyer.UpdateProfileRequest;
import com.nexus.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * FR-03 — hồ sơ của Seller.
 * <p>
 * Hồ sơ Buyer và Seller dùng chung một bảng {@code users} với đúng cùng các trường được phép sửa,
 * nên controller này <b>tái sử dụng</b> {@link ProfileResponse}/{@link UpdateProfileRequest}
 * của gói {@code dto.buyer} thay vì nhân bản DTO y hệt (xem CONVENTIONS §6).
 * Nếu sau này hồ sơ Seller có thêm trường riêng (ví dụ thông tin gian hàng) thì tách DTO sang
 * {@code dto.seller}.
 */
@RestController
@RequestMapping("/api/v1/seller/profile")
@Tag(name = "Profile — Seller", description = "FR-03 (xem và cập nhật hồ sơ Seller)")
@PreAuthorize("hasRole('SELLER')")
@RequiredArgsConstructor
public class SellerProfileController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "FR-03 — Seller xem hồ sơ của chính mình")
    public ResponseEntity<ProfileResponse> getProfile() {
        UUID currentUserId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(userService.getProfile(currentUserId, currentUserId));
    }

    @PutMapping
    @Operation(summary = "FR-03 — Seller cập nhật hồ sơ của chính mình (không đổi email/username)")
    public ResponseEntity<ProfileResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        UUID currentUserId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(userService.updateProfile(currentUserId, currentUserId, request));
    }
}
