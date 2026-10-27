package com.nexus.commerce.dto.buyer;

import com.nexus.commerce.enums.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * FR-21 — Buyer khởi tạo giao dịch thanh toán cho một đơn.
 *
 * <p>{@code idempotencyKey} do client sinh (UUID/chuỗi duy nhất). Gửi lại cùng khoá ⇒ service trả
 * về giao dịch đã tạo trước đó, KHÔNG tạo bản ghi mới và KHÔNG trừ tiền lần hai.</p>
 */
public record CreatePaymentRequest(

        @NotNull(message = "paymentMethod không được để trống")
        PaymentMethod paymentMethod,

        @NotNull(message = "amount không được để trống")
        @Positive(message = "amount phải lớn hơn 0")
        BigDecimal amount,

        @NotBlank(message = "idempotencyKey không được để trống")
        @Size(max = 255, message = "idempotencyKey tối đa 255 ký tự")
        String idempotencyKey
) {
}
