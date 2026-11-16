package com.nexus.user.dto.publicapi;

import com.nexus.user.service.RoleService;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Yêu cầu đăng ký tài khoản (FR-01) — Buyer hoặc Seller tự đăng ký.
 * <p>
 * KHÔNG cho phép tự đăng ký vai trò ADMIN: ràng buộc {@code @Pattern} chỉ nhận {@code BUYER|SELLER},
 * và service kiểm tra lại lần nữa (phòng thủ nhiều lớp).
 */
public record RegisterRequest(

        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không hợp lệ")
        @Size(max = 255, message = "Email tối đa 255 ký tự")
        String email,

        @NotBlank(message = "Tên đăng nhập không được để trống")
        @Size(min = 3, max = 50, message = "Tên đăng nhập phải từ 3 đến 50 ký tự")
        @Pattern(regexp = "^[a-zA-Z0-9._-]+$",
                message = "Tên đăng nhập chỉ gồm chữ cái, chữ số và các ký tự . _ -")
        String username,

        /** BCrypt chỉ dùng tối đa 72 byte đầu của mật khẩu → giới hạn 72 ký tự. */
        @NotBlank(message = "Mật khẩu không được để trống")
        @Size(min = 8, max = 72, message = "Mật khẩu phải từ 8 đến 72 ký tự")
        String password,

        @NotBlank(message = "Họ tên không được để trống")
        @Size(max = 150, message = "Họ tên tối đa 150 ký tự")
        String fullName,

        @Pattern(regexp = PHONE_PATTERN, message = "Số điện thoại không hợp lệ")
        String phone,

        @NotBlank(message = "Vai trò không được để trống")
        @Pattern(regexp = RoleService.ROLE_BUYER + "|" + RoleService.ROLE_SELLER,
                message = "Chỉ được đăng ký với vai trò BUYER hoặc SELLER")
        String role
) {

    /** Cho phép bỏ trống hoặc số điện thoại 8–20 ký tự (chữ số, +, -, khoảng trắng, ngoặc). */
    public static final String PHONE_PATTERN = "^$|^[0-9+][0-9+().\\-\\s]{7,19}$";
}
