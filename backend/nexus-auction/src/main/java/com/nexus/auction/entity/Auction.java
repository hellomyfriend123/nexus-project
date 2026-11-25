package com.nexus.auction.entity;

import com.nexus.auction.enums.AuctionStatus;
import com.nexus.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Phiên đấu giá (bảng {@code nexus_auction.auctions}) — FR-26 → FR-29, FR-33, FR-34, FR-37, FR-57.
 *
 * <p>{@code productId} / {@code sellerId} / {@code highestBidderId} là tham chiếu chéo module
 * dưới dạng UUID trần — KHÔNG có quan hệ JPA sang module khác (§2, §4 CONVENTIONS).</p>
 *
 * <p>{@code @Version} dùng để chống đua khi nhiều Buyer cùng đặt giá: lượt ghi sau phát hiện
 * version đã đổi sẽ nhận {@code ObjectOptimisticLockingFailureException} và được service
 * chuyển thành {@link com.nexus.common.exception.BusinessException}.</p>
 */
@Entity
@Table(name = "auctions", schema = "nexus_auction")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class Auction extends BaseEntity {

    /** Sản phẩm đưa ra đấu giá — tham chiếu sang nexus_catalog bằng UUID. */
    @Column(name = "product_id", nullable = false, updatable = false)
    private UUID productId;

    /** Người bán sở hữu phiên — tham chiếu sang nexus_user bằng UUID. */
    @Column(name = "seller_id", nullable = false, updatable = false)
    private UUID sellerId;

    /** Giá khởi điểm (FR-26), phải > 0. */
    @Column(name = "starting_price", nullable = false, precision = 19, scale = 2)
    private BigDecimal startingPrice;

    /** Giá cao nhất hiện tại; khởi tạo bằng {@code startingPrice}. */
    @Column(name = "current_price", nullable = false, precision = 19, scale = 2)
    private BigDecimal currentPrice;

    /** Người đang giữ giá cao nhất (nullable khi chưa có bid ACCEPTED). */
    @Column(name = "highest_bidder_id")
    private UUID highestBidderId;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "end_time", nullable = false)
    private Instant endTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AuctionStatus status;

    /** Khoá lạc quan — chống đua khi cập nhật {@code currentPrice}. */
    @Version
    @Column(name = "version", nullable = false)
    private Long version;
}
