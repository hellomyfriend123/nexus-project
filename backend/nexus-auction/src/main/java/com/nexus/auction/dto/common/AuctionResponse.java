package com.nexus.auction.dto.common;

import com.nexus.auction.enums.AuctionStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Chi tiết một phiên đấu giá — FR-28 (mọi role đã đăng nhập).
 * Không chứa {@code version} (§12 CONVENTIONS).
 */
public record AuctionResponse(
        UUID id,
        UUID productId,
        UUID sellerId,
        BigDecimal startingPrice,
        BigDecimal currentPrice,
        Instant startTime,
        Instant endTime,
        AuctionStatus status,
        UUID highestBidderId,
        long acceptedBidCount,
        Instant createdAt,
        Instant updatedAt
) {
}
