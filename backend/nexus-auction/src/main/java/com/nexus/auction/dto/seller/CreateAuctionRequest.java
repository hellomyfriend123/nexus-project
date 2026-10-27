package com.nexus.auction.dto.seller;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * FR-26 — Seller tạo phiên đấu giá.
 * {@code sellerId} KHÔNG nhận từ client: lấy từ token (§7.5).
 */
public record CreateAuctionRequest(

        @NotNull(message = "productId không được để trống")
        UUID productId,

        @NotNull(message = "startingPrice không được để trống")
        @Positive(message = "startingPrice phải lớn hơn 0")
        BigDecimal startingPrice,

        @NotNull(message = "startTime không được để trống")
        Instant startTime,

        @NotNull(message = "endTime không được để trống")
        Instant endTime
) {
}
