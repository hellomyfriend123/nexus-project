package com.nexus.user.controller.publicapi;

import com.nexus.common.security.SecurityUtils;
import com.nexus.user.dto.common.UserResponse;
import com.nexus.user.dto.publicapi.AuthResponse;
import com.nexus.user.dto.publicapi.LoginRequest;
import com.nexus.user.dto.publicapi.RegisterRequest;
import com.nexus.user.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * API công khai cho tài khoản — {@code /api/v1/auth/**}.
 * <p>
 * {@code register} và {@code login} được {@code SecurityConfig} cho phép {@code permitAll};
 * {@code logout} và {@code me} yêu cầu đã xác thực (mặc định {@code anyRequest().authenticated()}).
 */
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Auth — Xác thực & tài khoản", description = "FR-01 (đăng ký), FR-02 (đăng nhập/đăng xuất/thông tin hiện tại)")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @PreAuthorize("permitAll()")
    @Operation(summary = "FR-01 — Buyer/Seller đăng ký tài khoản")
    @ApiResponse(responseCode = "201", description = "Đăng ký thành công")
    @ApiResponse(responseCode = "409", description = "Email hoặc tên đăng nhập đã tồn tại")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    @PreAuthorize("permitAll()")
    @Operation(summary = "FR-02 — Đăng nhập bằng email và mật khẩu")
    @ApiResponse(responseCode = "200", description = "Đăng nhập thành công, trả về access token")
    @ApiResponse(responseCode = "401", description = "Email hoặc mật khẩu không đúng")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "FR-02 — Đăng xuất (hệ thống stateless: client xoá token)")
    @ApiResponse(responseCode = "204", description = "Đăng xuất thành công")
    public ResponseEntity<Void> logout() {
        authService.logout();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "FR-02 — Thông tin người dùng đang đăng nhập (lấy từ token)")
    public ResponseEntity<UserResponse> me() {
        // KHÔNG nhận userId từ client — luôn lấy từ token (SecurityUtils)
        UUID currentUserId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(authService.getCurrentUser(currentUserId));
    }
}
