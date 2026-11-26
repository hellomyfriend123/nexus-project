package com.nexus.user.dto.publicapi;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Yêu cầu đặt mật khẩu mới bằng mã nhận được từ luồng quên mật khẩu.
 * <p>
 * Mã (<code>token</code>) là chuỗi 43 ký tự base64url (32 byte ngẫu nhiên). Giới hạn
 * {@code max = 128} chỉ để chặn payload rác, không phải ràng buộc nghiệp vụ.
 */
public record ResetPasswordRequest(

        @NotBlank(message = "Mã đặt lại mật khẩu không được để trống")
        @Size(max = 128, message = "Mã đặt lại mật khẩu không hợp lệ")
        String token,

        /** Cùng ràng buộc với đăng ký: BCrypt chỉ dùng 72 byte đầu → tối đa 72 ký tự. */
        @NotBlank(message = "Mật khẩu mới không được để trống")
        @Size(min = 8, max = 72, message = "Mật khẩu phải từ 8 đến 72 ký tự")
        String newPassword
) {
}
