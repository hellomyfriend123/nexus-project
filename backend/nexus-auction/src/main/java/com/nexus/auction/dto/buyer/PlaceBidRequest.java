package com.nexus.auction.dto.buyer;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

/**
 * FR-30 — Buyer đặt giá.
 * {@code bidderId} KHÔNG nhận từ client: lấy từ token (§7.5).
 */
public record PlaceBidRequest(

        @NotNull(message = "amount không được để trống")
        @Positive(message = "amount phải lớn hơn 0")
        BigDecimal amount
) {
}
