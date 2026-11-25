package com.nexus.auction.dto.common;

import com.nexus.auction.enums.BidStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Một lượt đặt giá — FR-30, FR-31, FR-57. */
public record BidResponse(
        UUID id,
        UUID auctionId,
        UUID bidderId,
        BigDecimal amount,
        BidStatus status,
        Instant placedAt
) {
}
