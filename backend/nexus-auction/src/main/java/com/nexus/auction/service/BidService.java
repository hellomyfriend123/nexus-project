package com.nexus.auction.service;

import com.nexus.auction.dto.common.BidResponse;
import com.nexus.common.api.PageResponse;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.UUID;

/** Nghiệp vụ đặt giá — FR-30, FR-31 (FR-32 outbid sẽ gọi module notification ở giai đoạn business logic). */
public interface BidService {

    /**
     * FR-30 — Buyer đặt giá vào phiên đang ACTIVE.
     *
     * <p>Luật (§11.3): bid đầu tiên phải {@code >= startingPrice}; các bid sau phải {@code > currentPrice}.
     * Bid không hợp lệ vẫn được lưu với {@code status = REJECTED} rồi mới ném BusinessException.</p>
     */
    BidResponse placeBid(UUID bidderId, UUID auctionId, BigDecimal amount);

    /** FR-31 — Lịch sử bid công khai: chỉ bid ACCEPTED, mới nhất trước. */
    PageResponse<BidResponse> findAcceptedBids(UUID auctionId, Pageable pageable);
}
