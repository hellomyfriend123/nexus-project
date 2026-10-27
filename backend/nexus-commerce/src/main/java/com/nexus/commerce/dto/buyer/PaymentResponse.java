package com.nexus.commerce.dto.buyer;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Giao dịch thanh toán trả cho client (FR-21). Không lộ field kỹ thuật nội bộ nào khác của entity.
 */
public record PaymentResponse(
        UUID id,
        UUID orderId,
        String paymentMethod,
        String paymentReference,
        BigDecimal amount,
        String status,
        String idempotencyKey,
        Instant paidAt,
        Instant createdAt
) {
}
