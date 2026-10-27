package com.nexus.commerce.dto.buyer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * FR-21 — Buyer (hoặc cổng thanh toán giả lập) xác nhận kết quả giao dịch.
 * Chỉ nhận {@code SUCCESS} hoặc {@code FAILED}; trạng thái {@code PENDING} không được set từ API.
 */
public record ConfirmPaymentRequest(

        @NotBlank(message = "result không được để trống")
        @Pattern(regexp = "(?i)SUCCESS|FAILED", message = "result chỉ nhận SUCCESS hoặc FAILED")
        String result
) {
}
