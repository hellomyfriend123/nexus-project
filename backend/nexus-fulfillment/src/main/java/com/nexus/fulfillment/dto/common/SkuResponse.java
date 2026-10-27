package com.nexus.fulfillment.dto.common;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** SKU trả về cho Seller (endpoint nội bộ phục vụ FR-05 và FR-13). */
public record SkuResponse(
        UUID id,
        UUID productId,
        UUID sellerId,
        String skuCode,
        String name,
        BigDecimal price,
        Instant createdAt,
        Instant updatedAt
) {
}
