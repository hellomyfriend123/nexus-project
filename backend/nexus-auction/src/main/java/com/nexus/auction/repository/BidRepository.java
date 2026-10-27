package com.nexus.auction.repository;

import com.nexus.auction.entity.Bid;
import com.nexus.auction.enums.BidStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Truy cập bảng {@code nexus_auction.bids}.
 * Bid KHÔNG bị xóa (§11.6) — bid bị từ chối vẫn được giữ với {@code status = REJECTED}.
 */
@Repository
public interface BidRepository extends JpaRepository<Bid, UUID> {

    /** FR-31: lịch sử bid công khai — chỉ bid ACCEPTED, mới nhất trước. */
    Page<Bid> findByAuctionIdAndStatusOrderByPlacedAtDesc(UUID auctionId, BidStatus status, Pageable pageable);

    /** Bid ACCEPTED có giá cao nhất của phiên — dùng cho FR-35 khi chốt người thắng. */
    Optional<Bid> findTopByAuctionIdAndStatusOrderByAmountDesc(UUID auctionId, BidStatus status);

    /** Đếm số bid ACCEPTED của phiên (thống kê kèm theo cho Admin — FR-57). */
    long countByAuctionIdAndStatus(UUID auctionId, BidStatus status);

    /** FR-30: phiên đã có bid hợp lệ nào chưa (quyết định luật bid đầu tiên vs các bid sau). */
    boolean existsByAuctionIdAndStatus(UUID auctionId, BidStatus status);

    /** Toàn bộ bid của một phiên (mọi trạng thái) — phục vụ kiểm tra nội bộ. */
    List<Bid> findByAuctionIdOrderByPlacedAtDesc(UUID auctionId);

    /** Kiểm tra phiên đã từng nhận bid nào chưa (kể cả bid bị từ chối). */
    boolean existsByAuctionId(UUID auctionId);
}
