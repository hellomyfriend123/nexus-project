package com.nexus.auction.entity;

import com.nexus.auction.enums.SettlementStatus;
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
 * Kết quả chốt một phiên đấu giá (bảng {@code nexus_auction.auction_settlements}) — FR-35.
 *
 * <p>KHÔNG có {@code payment_deadline} (§11.2 CONVENTIONS). {@code orderId} sẽ được điền ở
 * giai đoạn business logic khi FR-36 tạo Order loại AUCTION qua module commerce — hiện để null.</p>
 */
@Entity
@Table(name = "auction_settlements", schema = "nexus_auction")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuctionSettlement extends BaseEntity {

    /** Phiên được chốt — tham chiếu nội bộ module bằng UUID. */
    @Column(name = "auction_id", nullable = false, updatable = false)
    private UUID auctionId;

    /** Người thắng (nullable khi {@code status = NO_BIDS}). */
    @Column(name = "winner_id")
    private UUID winnerId;

    /** Order loại AUCTION sinh bởi FR-36 (giai đoạn business logic) — hiện để null. */
    @Column(name = "order_id")
    private UUID orderId;

    /** Giá chốt cuối cùng = bid ACCEPTED cao nhất (nullable khi không có bid). */
    @Column(name = "final_price", precision = 19, scale = 2)
    private BigDecimal finalPrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SettlementStatus status;

    /** Thời điểm chốt phiên. */
    @Column(name = "settled_at", nullable = false)
    private Instant settledAt;
}
