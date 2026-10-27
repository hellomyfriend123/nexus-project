package com.nexus.commerce.dto.buyer;

import java.time.Instant;
import java.util.UUID;

/**
 * Đánh giá Seller trả cho client (FR-43/44). Không trả field kỹ thuật nội bộ của entity.
 */
public record SellerRatingResponse(
        UUID id,
        UUID orderId,
        UUID sellerId,
        UUID buyerId,
        Integer score,
        String comment,
        String status,
        Instant createdAt
) {
}
