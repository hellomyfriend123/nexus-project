package com.nexus.commerce.dto.buyer;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Đơn hàng rút gọn cho endpoint danh sách (FR-23) — không kèm danh sách dòng hàng
 * để tránh N+1 và giữ payload nhỏ.
 */
public record OrderSummaryResponse(
        UUID id,
        String orderNumber,
        UUID buyerId,
        UUID sellerId,
        String orderType,
        String status,
        BigDecimal totalAmount,
        int itemCount,
        Instant createdAt
) {
}
