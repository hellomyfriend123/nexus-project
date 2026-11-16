package com.nexus.catalog.dto.common;

import com.nexus.catalog.enums.ReviewStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * Đánh giá sản phẩm (FR-41, FR-42, FR-45, FR-59).
 * {@code buyerId} / {@code orderId} là UUID tham chiếu chéo module.
 */
public record ReviewResponse(
        UUID id,
        UUID productId,
        UUID buyerId,
        UUID orderId,
        Integer score,
        String comment,
        ReviewStatus status,
        Instant createdAt
) {
}
