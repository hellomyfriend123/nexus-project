package com.nexus.user.controller.publicapi;

import com.nexus.common.security.SecurityUtils;
import com.nexus.user.dto.common.UserResponse;
import com.nexus.user.dto.publicapi.AuthResponse;
import com.nexus.user.dto.publicapi.ForgotPasswordRequest;
import com.nexus.user.dto.publicapi.ForgotPasswordResponse;
import com.nexus.user.dto.publicapi.LoginRequest;
import com.nexus.user.dto.publicapi.OAuth2ExchangeRequest;
import com.nexus.user.dto.publicapi.RegisterRequest;
import com.nexus.user.dto.publicapi.ResetPasswordRequest;
import com.nexus.user.service.AuthService;
import com.nexus.user.service.PasswordResetService;
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
 * <p>
 * {@code forgot-password} và {@code reset-password} cũng {@code permitAll} vì người dùng quên mật
 * khẩu thì <b>không thể</b> có token — chính mã đặt lại trong request là bằng chứng xác thực.
 */
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Auth — Xác thực & tài khoản", description = "FR-01 (đăng ký), FR-02 (đăng nhập/đăng xuất/thông tin hiện tại, quên mật khẩu)")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

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

    /**
     * Bước 1 của luồng quên mật khẩu — cấp mã đặt lại cho email.
     * <p>
     * <b>Luôn trả 200</b>, kể cả khi email không tồn tại: trả 404 cho email lạ sẽ biến endpoint này
     * thành công cụ dò danh sách tài khoản của hệ thống.
     * <p>
     * Mã thô chỉ xuất hiện trong response khi bật {@code nexus.security.password-reset.expose-token}
     * (mặc định tắt). Bật cờ đó cho dev/demo để không cần cấu hình SMTP.
     */
    @PostMapping("/forgot-password")
    @PreAuthorize("permitAll()")
    @Operation(summary = "FR-02 — Quên mật khẩu: yêu cầu mã đặt lại qua email",
            description = "Luôn trả cùng một thông báo để không tiết lộ email có tồn tại hay không")
    @ApiResponse(responseCode = "200", description = "Đã xử lý yêu cầu (thông báo chung)")
    public ResponseEntity<ForgotPasswordResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(passwordResetService.requestReset(request));
    }

    /**
     * Bước 2 của luồng quên mật khẩu — đặt mật khẩu mới bằng mã nhận được.
     * <p>
     * Mã dùng một lần và có hạn (mặc định 15 phút). Đổi thành công sẽ vô hiệu hoá mọi mã khác
     * còn treo của tài khoản. Người dùng phải đăng nhập lại sau khi đổi mật khẩu.
     */
    @PostMapping("/reset-password")
    @PreAuthorize("permitAll()")
    @Operation(summary = "FR-02 — Quên mật khẩu: đặt mật khẩu mới bằng mã đặt lại")
    @ApiResponse(responseCode = "204", description = "Đặt lại mật khẩu thành công")
    @ApiResponse(responseCode = "400", description = "Mật khẩu mới trùng mật khẩu cũ")
    @ApiResponse(responseCode = "401", description = "Mã sai, đã dùng hoặc đã hết hạn")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request);
        return ResponseEntity.noContent().build();
    }

    /**
     * Đổi mã dùng-một-lần (nhận từ URL callback của OAuth2) lấy phiên đăng nhập thật.
     * <p>
     * Phải {@code permitAll} vì tại thời điểm này client <b>chưa có</b> token — mã chính là
     * bằng chứng xác thực. Mã sống 60 giây và chỉ dùng được một lần.
     */
    @PostMapping("/oauth2/exchange")
    @PreAuthorize("permitAll()")
    @Operation(summary = "FR-02 — Đổi mã đăng nhập Google lấy access token")
    @ApiResponse(responseCode = "200", description = "Đổi mã thành công, trả về access token")
    @ApiResponse(responseCode = "401", description = "Mã không hợp lệ, đã dùng hoặc đã hết hạn")
    public ResponseEntity<AuthResponse> exchangeOAuth2Code(@Valid @RequestBody OAuth2ExchangeRequest request) {
        return ResponseEntity.ok(authService.exchangeOAuth2Code(request.code()));
    }
}
