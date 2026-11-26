package com.nexus.user.dto.publicapi;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Yêu cầu cấp mã đặt lại mật khẩu (quên mật khẩu).
 * <p>
 * Endpoint <b>luôn trả 200</b> dù email có tồn tại hay không — nếu trả 404 cho email lạ thì
 * kẻ tấn công dùng API này để dò danh sách tài khoản của hệ thống.
 */
public record ForgotPasswordRequest(

        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không hợp lệ")
        @Size(max = 255, message = "Email tối đa 255 ký tự")
        String email
) {
}
