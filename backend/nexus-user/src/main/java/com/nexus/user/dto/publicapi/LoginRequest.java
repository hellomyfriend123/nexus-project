package com.nexus.user.dto.publicapi;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Yêu cầu đăng nhập (FR-02).
 * <p>
 * Sai email hoặc sai mật khẩu đều trả về cùng một thông báo
 * "Email hoặc mật khẩu không đúng" để không tiết lộ tài khoản nào đang tồn tại.
 */
public record LoginRequest(

        @NotBlank(message = "Email không được để trống")
        @Size(max = 255, message = "Email tối đa 255 ký tự")
        String email,

        @NotBlank(message = "Mật khẩu không được để trống")
        @Size(max = 72, message = "Mật khẩu tối đa 72 ký tự")
        String password
) {
}
