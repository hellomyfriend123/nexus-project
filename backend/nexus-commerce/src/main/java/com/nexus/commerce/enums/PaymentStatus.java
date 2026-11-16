package com.nexus.commerce.enums;

import java.util.Locale;
import java.util.Optional;

/**
 * Trạng thái giao dịch thanh toán (FR-21, §16).
 * DB có unique partial index {@code ux_payments_one_success_per_order}: mỗi đơn tối đa MỘT giao dịch SUCCESS.
 */
public enum PaymentStatus {

    /** Vừa khởi tạo, chờ xác nhận kết quả. */
    PENDING,

    SUCCESS,

    FAILED;

    /** Parse từ request {@code {result: SUCCESS|FAILED}} (không phân biệt hoa thường). */
    public static Optional<PaymentStatus> parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(valueOf(raw.trim().toUpperCase(Locale.ROOT)));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }
}
