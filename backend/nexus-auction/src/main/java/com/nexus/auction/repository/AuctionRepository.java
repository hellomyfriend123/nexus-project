package com.nexus.auction.repository;

import com.nexus.auction.entity.Auction;
import com.nexus.auction.enums.AuctionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Truy cập bảng {@code nexus_auction.auctions}.
 *
 * <p>Auction KHÔNG có soft delete (chỉ có {@code status}), nên không cần lọc {@code deletedAt}.</p>
 */
@Repository
public interface AuctionRepository extends JpaRepository<Auction, UUID> {

    /** FR-26: kiểm tra sản phẩm đã có phiên đang chờ chạy / đang diễn ra hay chưa (chỉ trong bảng của module này). */
    Optional<Auction> findFirstByProductIdAndStatusIn(UUID productId, Collection<AuctionStatus> statuses);

    /** FR-33: các phiên SCHEDULED đã tới giờ mở. */
    List<Auction> findByStatusAndStartTimeLessThanEqual(AuctionStatus status, Instant now);

    /** FR-34: các phiên ACTIVE đã tới giờ đóng. */
    List<Auction> findByStatusAndEndTimeLessThanEqual(AuctionStatus status, Instant now);

    /** FR-35: toàn bộ phiên đã ENDED — dùng để lọc ra những phiên chưa có settlement. */
    List<Auction> findByStatus(AuctionStatus status);

    /**
     * FR-29 / FR-57: danh sách phiên mới nhất trước.
     * {@code status}/{@code productId}/{@code sellerId} nullable — null nghĩa là bỏ qua điều kiện đó.
     * Query tách riêng cho từng tổ hợp để tránh phải so sánh {@code :param is null} với kiểu UUID.
     */
    @Query("""
            select a from Auction a
            where (:status is null or a.status = :status)
              and (:productId is null or a.productId = :productId)
              and (:sellerId is null or a.sellerId = :sellerId)
            order by a.createdAt desc
            """)
    Page<Auction> search(@Param("status") AuctionStatus status,
                         @Param("productId") UUID productId,
                         @Param("sellerId") UUID sellerId,
                         Pageable pageable);

    /** FR-29: tìm theo từ khóa UUID (khớp productId hoặc sellerId) khi không lọc theo trạng thái. */
    @Query("""
            select a from Auction a
            where a.productId = :keyword or a.sellerId = :keyword
            order by a.createdAt desc
            """)
    Page<Auction> searchByKeyword(@Param("keyword") UUID keyword, Pageable pageable);

    /** FR-29: tìm theo cả trạng thái và từ khóa UUID. */
    @Query("""
            select a from Auction a
            where a.status = :status
              and (a.productId = :keyword or a.sellerId = :keyword)
            order by a.createdAt desc
            """)
    Page<Auction> searchByStatusAndKeyword(@Param("status") AuctionStatus status,
                                           @Param("keyword") UUID keyword,
                                           Pageable pageable);
}
