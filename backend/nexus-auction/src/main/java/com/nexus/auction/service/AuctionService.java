package com.nexus.auction.service;

import com.nexus.auction.dto.common.AdminAuctionResponse;
import com.nexus.auction.dto.common.AuctionResponse;
import com.nexus.auction.dto.common.AuctionSummaryResponse;
import com.nexus.auction.dto.common.SettlementResponse;
import com.nexus.common.api.PageResponse;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Nghiệp vụ phiên đấu giá — FR-26 → FR-29, FR-33, FR-34, FR-35, FR-37, FR-57.
 *
 * <p>Xử lý chống đua bid dựa trên {@code @Version} của {@link com.nexus.auction.entity.Auction}:
 * lượt ghi thua sẽ nhận {@code ObjectOptimisticLockingFailureException} và được chuyển
 * thành {@code BusinessException("Có người vừa đặt giá, vui lòng thử lại")}.</p>
 */
public interface AuctionService {

    /** FR-26 — Seller tạo phiên đấu giá (status SCHEDULED, currentPrice = startingPrice). */
    AuctionResponse create(UUID sellerId, UUID productId, BigDecimal startingPrice,
                           Instant startTime, Instant endTime);

    /** FR-27 — Seller cấu hình lại phiên, chỉ khi phiên còn SCHEDULED. */
    AuctionResponse update(UUID sellerId, UUID auctionId, BigDecimal startingPrice,
                           Instant startTime, Instant endTime);

    /** FR-28 — Xem chi tiết phiên (mọi role đã đăng nhập). */
    AuctionResponse getById(UUID auctionId);

    /** FR-29 — Danh sách phiên, lọc theo status + keyword (productId/sellerId). */
    PageResponse<AuctionSummaryResponse> search(String status, String keyword, Pageable pageable);

    /**
     * FR-57 — Admin xem toàn bộ phiên kèm lịch sử bid, có thể lọc theo status + keyword.
     * Truyền {@code null} cho cả hai tham số để lấy toàn bộ.
     */
    PageResponse<AdminAuctionResponse> listForAdmin(String status, String keyword, Pageable pageable);

    /** FR-37 — Seller hủy phiên của chính mình (chỉ khi SCHEDULED/ACTIVE). */
    AuctionResponse cancelBySeller(UUID sellerId, UUID auctionId);

    /** FR-37 — Admin hủy bất kỳ phiên nào (chỉ khi SCHEDULED/ACTIVE). */
    AuctionResponse cancelByAdmin(UUID auctionId);

    /** Xem kết quả chốt phiên (winner, finalPrice, status). */
    SettlementResponse getSettlement(UUID auctionId);

    // ------------------------------------------------------------------
    // FR-33 / FR-34 / FR-35 — dùng bởi AuctionScheduler
    // ------------------------------------------------------------------

    /** FR-33 — Mở các phiên SCHEDULED đã tới {@code startTime}. Trả về danh sách id đã chuyển ACTIVE. */
    List<UUID> activateDueAuctions();

    /** FR-34 — Đóng các phiên ACTIVE đã quá {@code endTime}. Trả về danh sách id đã chuyển ENDED. */
    List<UUID> closeExpiredAuctions();

    /**
     * FR-35 — Danh sách phiên đã ENDED nhưng CHƯA có settlement (idempotent cho scheduler).
     */
    List<UUID> findUnsettledEndedAuctionIds();
}
