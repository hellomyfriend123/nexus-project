package com.nexus.auction.dto.common;

import com.nexus.auction.enums.AuctionStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Bản ghi dành cho Admin (FR-57): thông tin phiên + lịch sử bid của chính phiên đó.
 * Gộp một lần gọi thay vì bắt client gọi thêm FR-31 cho từng phiên.
 *
 * @param bidCount        tổng số bid đã ghi nhận (mọi trạng thái).
 * @param acceptedBidCount số bid ACCEPTED.
 * @param bids            lịch sử bid ACCEPTED, mới nhất trước (tối đa 50 bản ghi gần nhất).
 */
public record AdminAuctionResponse(
        UUID id,
        UUID productId,
        UUID sellerId,
        BigDecimal startingPrice,
        BigDecimal currentPrice,
        Instant startTime,
        Instant endTime,
        AuctionStatus status,
        UUID highestBidderId,
        long bidCount,
        long acceptedBidCount,
        List<BidResponse> bids
) {
}
