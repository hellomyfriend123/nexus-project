package com.nexus.user.dto.buyer;

import com.nexus.user.dto.publicapi.RegisterRequest;
import com.nexus.user.enums.Gender;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Yêu cầu cập nhật hồ sơ (FR-03) — dùng cho cả Buyer và Seller.
 * <p>
 * <b>KHÔNG cho sửa {@code email}/{@code username} ở đây</b>: đó là định danh đăng nhập (khoá duy nhất,
 * gắn với token và mọi tham chiếu dữ liệu của module khác). Muốn đổi phải đi qua luồng riêng
 * có xác minh quyền sở hữu (gửi OTP/email xác nhận) — nằm ngoài phạm vi FR-03.
 * <p>
 * Ngữ nghĩa cập nhật: trường {@code null} = giữ nguyên; gửi chuỗi rỗng = xoá giá trị.
 */
public record UpdateProfileRequest(

        @Size(max = 150, message = "Họ tên tối đa 150 ký tự")
        String fullName,

        @Pattern(regexp = RegisterRequest.PHONE_PATTERN, message = "Số điện thoại không hợp lệ")
        String phone,

        @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
        String address,

        @Past(message = "Ngày sinh phải là một ngày trong quá khứ")
        LocalDate dateOfBirth,

        Gender gender
) {
}
