package com.nexus.commerce.dto.buyer;

import com.nexus.commerce.enums.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * FR-19 / FR-22 — Buyer checkout giỏ hàng đang ACTIVE thành đơn hàng.
 *
 * <p>{@code discountCode} là tuỳ chọn; nếu có, service kiểm tra lại mã (FR-20/48) và tính lại
 * số tiền giảm trên chính dữ liệu trong DB — không tin số tiền client gửi lên.</p>
 *
 * <p>Không nhận {@code buyerId} từ request: lấy từ token (§7.5).</p>
 */
public record CheckoutRequest(

        @NotBlank(message = "receiverName không được để trống")
        @Size(max = 150, message = "receiverName tối đa 150 ký tự")
        String receiverName,

        @NotBlank(message = "receiverPhone không được để trống")
        @Pattern(regexp = "^[0-9+][0-9\\-\\s]{7,19}$", message = "receiverPhone không hợp lệ")
        String receiverPhone,

        @NotBlank(message = "shippingAddress không được để trống")
        @Size(max = 500, message = "shippingAddress tối đa 500 ký tự")
        String shippingAddress,

        @NotNull(message = "paymentMethod không được để trống")
        PaymentMethod paymentMethod,

        /** Mã giảm giá (tuỳ chọn) — ví dụ {@code SALE10}. */
        @Size(max = 50, message = "discountCode tối đa 50 ký tự")
        String discountCode
) {
}
