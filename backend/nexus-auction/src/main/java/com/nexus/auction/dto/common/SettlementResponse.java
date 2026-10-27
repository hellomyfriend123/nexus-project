package com.nexus.auction.dto.common;

import com.nexus.auction.enums.SettlementStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Kết quả chốt phiên đấu giá — FR-35.
 *
 * @param orderId   Order loại AUCTION do FR-36 sinh ra; hiện luôn {@code null} vì FR-36
 *                  thuộc giai đoạn business logic (gọi module commerce).
 * @param bidCount  số bid ACCEPTED của phiên, giúp client hiển thị ngữ cảnh.
 */
public record SettlementResponse(
        UUID id,
        UUID auctionId,
        UUID winnerId,
        UUID orderId,
        BigDecimal finalPrice,
        SettlementStatus status,
        Instant settledAt,
        long bidCount
) {
}
