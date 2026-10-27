package com.nexus.commerce.dto.admin;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Mã giảm giá trả cho Admin (FR-47/58) — có kèm {@code usedCount} để theo dõi hạn mức.
 */
public record DiscountCodeResponse(
        UUID id,
        UUID campaignId,
        String code,
        String discountType,
        BigDecimal discountValue,
        BigDecimal minOrderAmount,
        Integer usageLimit,
        Integer usedCount,
        Instant startAt,
        Instant endAt,
        String status,
        Instant createdAt,
        Instant updatedAt
) {
}
