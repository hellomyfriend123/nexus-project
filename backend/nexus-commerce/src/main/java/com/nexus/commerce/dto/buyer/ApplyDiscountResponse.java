package com.nexus.commerce.dto.buyer;

import java.math.BigDecimal;

/**
 * FR-20 / FR-48 — Kết quả xem trước mã giảm giá.
 * {@code finalAmount = orderAmount - discountAmount} (đã làm tròn HALF_UP, không âm).
 */
public record ApplyDiscountResponse(
        String code,
        String discountType,
        BigDecimal orderAmount,
        BigDecimal discountAmount,
        BigDecimal finalAmount
) {
}
