package com.nexus.auction.service.impl;

import com.nexus.auction.entity.Auction;
import com.nexus.auction.entity.Bid;
import com.nexus.auction.enums.AuctionStatus;
import com.nexus.auction.enums.BidStatus;
import com.nexus.auction.repository.AuctionRepository;
import com.nexus.auction.repository.BidRepository;
import com.nexus.common.api.ErrorCode;
import com.nexus.common.exception.BusinessException;
import com.nexus.common.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Phần GHI của FR-30, tách riêng thành một bean để có ranh giới transaction
 * thật sự.
 *
 * <p>
 * Lý do tách: nếu đặt logic này trong một phương thức {@code @Transactional}
 * private/protected
 * của {@link BidServiceImpl} thì lời gọi nội bộ sẽ bỏ qua proxy của Spring —
 * transaction không
 * được mở và bid {@link BidStatus#REJECTED} sẽ bị rollback. Ở đây
 * {@link BidServiceImpl#placeBid}
 * gọi qua proxy của bean này, nên:
 * </p>
 * <ul>
 * <li>Toàn bộ việc đọc phiên + áp luật bid + ghi bid/auction nằm trong MỘT
 * transaction.</li>
 * <li>Bid {@code REJECTED} được COMMIT trước khi {@link BidServiceImpl} ném
 * BusinessException.</li>
 * <li>{@code ObjectOptimisticLockingFailureException} (do {@code @Version} của
 * Auction) thoát ra
 * NGOÀI transaction và được đổi thành BusinessException "Có người vừa đặt giá,
 * vui lòng thử lại".</li>
 * </ul>
 */
@Slf4j
@Component
@Builder
class BidPlacementHandler {

    private final AuctionRepository auctionRepository;
    private final BidRepository bidRepository;

    public BidPlacementHandler(AuctionRepository auctionRepository, BidRepository bidRepository) {
        this.auctionRepository = auctionRepository;
        this.bidRepository = bidRepository;
    }

    /**
     * Thực hiện một lượt đặt giá trong transaction riêng.
     *
     * @return {@link PlacementResult#accepted(Bid)} nếu bid hợp lệ,
     *         {@link PlacementResult#rejected(String)} nếu bid không hợp lệ — lúc
     *         này bid
     *         {@code REJECTED} ĐÃ được commit và bên gọi chỉ cần ném
     *         BusinessException theo thông báo.
     */
    @Transactional
    PlacementResult place(UUID bidderId, UUID auctionId, BigDecimal amount) {
        if (amount == null || amount.signum() <= 0) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "amount phải lớn hơn 0");
        }

        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new ResourceNotFoundException("Phiên đấu giá", auctionId));

        // 1) Chỉ nhận bid khi phiên đang ACTIVE — các trường hợp khác KHÔNG lưu bid.
        if (auction.getStatus() != AuctionStatus.ACTIVE) {
            throw new BusinessException("Phiên đấu giá chưa mở hoặc đã kết thúc, không thể đặt giá");
        }

        // 2) Seller không được tự đặt giá cho phiên của mình.
        if (auction.getSellerId().equals(bidderId)) {
            throw new BusinessException("Bạn là người bán, không thể tự đặt giá cho phiên của mình");
        }

        Instant now = Instant.now();
        boolean hasAcceptedBid = bidRepository.existsByAuctionIdAndStatus(auctionId, BidStatus.ACCEPTED);

        // 3) Bid đầu tiên phải >= startingPrice.
        if (!hasAcceptedBid && amount.compareTo(auction.getStartingPrice()) < 0) {
            saveBid(auctionId, bidderId, amount, BidStatus.REJECTED, now);
            log.info("FR-30: từ chối bid đầu tiên {} của bidder {} cho phiên {} (startingPrice {})",
                    amount, bidderId, auctionId, auction.getStartingPrice());
            return PlacementResult.rejected("Giá đặt phải lớn hơn hoặc bằng giá khởi điểm "
                    + auction.getStartingPrice().toPlainString());
        }

        // 4) Các bid sau phải > currentPrice — nếu không VẪN lưu bid REJECTED (FR-30).
        if (hasAcceptedBid && amount.compareTo(auction.getCurrentPrice()) <= 0) {
            saveBid(auctionId, bidderId, amount, BidStatus.REJECTED, now);
            log.info("FR-30: từ chối bid {} của bidder {} cho phiên {} (currentPrice {})",
                    amount, bidderId, auctionId, auction.getCurrentPrice());
            return PlacementResult.rejected("Giá đặt phải cao hơn giá hiện tại "
                    + auction.getCurrentPrice().toPlainString());
        }

        // 5) Hợp lệ → lưu ACCEPTED rồi cập nhật giá cao nhất (kiểm tra @Version khi
        // flush → chống đua bid).
        // Bidder đang giữ giá cao nhất trước đó chính là người bị vượt giá (FR-32 —
        // giai đoạn sau).
        UUID previousHighestBidderId = auction.getHighestBidderId();
        Bid accepted = saveBid(auctionId, bidderId, amount, BidStatus.ACCEPTED, now);

        auction.setCurrentPrice(amount);
        auction.setHighestBidderId(bidderId);
        auctionRepository.save(auction);

        // TODO (FR-32 — giai đoạn business logic): nếu previousHighestBidderId != null
        // và khác
        // bidderId, gọi module nexus-notification để tạo thông báo OUTBID cho người bị
        // vượt giá.
        if (previousHighestBidderId != null && !previousHighestBidderId.equals(bidderId)) {
            log.info("FR-32 (TODO): người dùng {} bị vượt giá bởi {} ở phiên {}",
                    previousHighestBidderId, bidderId, auctionId);
        }
        log.info("FR-30: bidder {} đặt giá {} cho phiên {}", bidderId, amount, auctionId);
        return PlacementResult.accepted(accepted);
    }

    private Bid saveBid(UUID auctionId, UUID bidderId, BigDecimal amount, BidStatus status, Instant placedAt) {
        return bidRepository.save(Bid.builder()
                .auctionId(auctionId)
                .bidderId(bidderId)
                .amount(amount)
                .status(status)
                .placedAt(placedAt)
                .build());
    }

    /**
     * Kết quả một lượt đặt giá trong transaction.
     * {@code acceptedBid == null} nghĩa là bid đã bị từ chối và được lưu với status
     * REJECTED.
     */
    record PlacementResult(Bid acceptedBid, String rejectionMessage) {

        static PlacementResult accepted(Bid bid) {
            return new PlacementResult(bid, null);
        }

        static PlacementResult rejected(String message) {
            return new PlacementResult(null, message);
        }

        boolean isRejected() {
            return acceptedBid == null;
        }
    }
}
