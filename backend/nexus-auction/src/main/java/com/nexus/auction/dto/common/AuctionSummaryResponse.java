package com.nexus.auction.dto.common;

import com.nexus.auction.enums.AuctionStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Bản rút gọn của phiên đấu giá cho endpoint danh sách — FR-29, FR-57. */
public record AuctionSummaryResponse(
        UUID id,
        UUID productId,
        UUID sellerId,
        BigDecimal startingPrice,
        BigDecimal currentPrice,
        Instant startTime,
        Instant endTime,
        AuctionStatus status,
        UUID highestBidderId
) {
}
