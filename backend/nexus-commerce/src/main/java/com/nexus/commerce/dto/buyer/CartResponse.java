package com.nexus.commerce.dto.buyer;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Giỏ hàng của Buyer (FR-15). Trả kèm danh sách dòng hàng và {@code subtotal} đã tính lại.
 */
public record CartResponse(
        UUID id,
        UUID buyerId,
        String status,
        BigDecimal subtotal,
        int itemCount,
        List<CartItemResponse> items,
        Instant createdAt,
        Instant updatedAt
) {
}
