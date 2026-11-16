package com.nexus.user.controller.buyer;

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
 * FR-03 — hồ sơ của Buyer.
 * <p>
 * Không có {@code {id}} trên đường dẫn: người dùng chỉ thao tác trên hồ sơ của chính mình,
 * danh tính lấy từ token qua {@code SecurityUtils.currentUserId()} (chống giả mạo).
 */
@RestController
@RequestMapping("/api/v1/buyer/profile")
@Tag(name = "Profile — Buyer", description = "FR-03 (xem và cập nhật hồ sơ Buyer)")
@PreAuthorize("hasRole('BUYER')")
@RequiredArgsConstructor
public class BuyerProfileController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "FR-03 — Buyer xem hồ sơ của chính mình")
    public ResponseEntity<ProfileResponse> getProfile() {
        UUID currentUserId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(userService.getProfile(currentUserId, currentUserId));
    }

    @PutMapping
    @Operation(summary = "FR-03 — Buyer cập nhật hồ sơ của chính mình (không đổi email/username)")
    public ResponseEntity<ProfileResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        UUID currentUserId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(userService.updateProfile(currentUserId, currentUserId, request));
    }
}
