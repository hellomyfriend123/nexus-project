package com.nexus.auction.entity;

import com.nexus.auction.enums.BidStatus;
import com.nexus.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Một lượt đặt giá (bảng {@code nexus_auction.bids}) — FR-30, FR-31, FR-35.
 *
 * <p>
 * Luật bid (§11.3 CONVENTIONS): KHÔNG có {@code bid_increment}.
 * Bid đầu tiên phải {@code >= startingPrice}; các bid sau phải
 * {@code > currentPrice}.
 * </p>
 *
 * <p>
 * Bid {@code REJECTED} vẫn được lưu (FR-30) — không hard delete bản ghi nghiệp
 * vụ.
 * </p>
 */
@Entity
@Table(name = "bids", schema = "nexus_auction")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Bid extends BaseEntity {

    /**
     * Phiên đấu giá nhận bid — tham chiếu nội bộ module bằng UUID (không
     * dùng @ManyToOne).
     */
    @Column(name = "auction_id", nullable = false, updatable = false)
    private UUID auctionId;

    /** Người đặt giá — tham chiếu sang nexus_user bằng UUID. */
    @Column(name = "bidder_id", nullable = false, updatable = false)
    private UUID bidderId;

    @Column(name = "amount", nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private BidStatus status;

    /** Thời điểm đặt giá do server ghi nhận (không nhận từ client). */
    @Column(name = "placed_at", nullable = false)
    private Instant placedAt;
}
