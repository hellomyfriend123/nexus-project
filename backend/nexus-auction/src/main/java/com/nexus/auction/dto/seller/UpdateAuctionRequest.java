package com.nexus.auction.dto.seller;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * FR-27 — Seller cấu hình lại phiên đấu giá.
 * CHỈ áp dụng khi phiên còn {@code SCHEDULED}; nếu đã ACTIVE/ENDED/CANCELLED → BusinessException.
 */
public record UpdateAuctionRequest(

        @NotNull(message = "startingPrice không được để trống")
        @Positive(message = "startingPrice phải lớn hơn 0")
        BigDecimal startingPrice,

        @NotNull(message = "startTime không được để trống")
        Instant startTime,

        @NotNull(message = "endTime không được để trống")
        Instant endTime
) {
}
