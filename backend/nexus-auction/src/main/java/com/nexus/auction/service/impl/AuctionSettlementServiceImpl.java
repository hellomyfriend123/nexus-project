package com.nexus.auction.service.impl;

import com.nexus.auction.entity.Auction;
import com.nexus.auction.entity.AuctionSettlement;
import com.nexus.auction.entity.Bid;
import com.nexus.auction.enums.AuctionStatus;
import com.nexus.auction.enums.BidStatus;
import com.nexus.auction.enums.SettlementStatus;
import com.nexus.auction.repository.AuctionRepository;
import com.nexus.auction.repository.AuctionSettlementRepository;
import com.nexus.auction.repository.BidRepository;
import com.nexus.auction.service.AuctionSettlementService;
import com.nexus.common.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Cài đặt {@link AuctionSettlementService} — FR-35 (chốt người thắng sau khi
 * FR-34 đóng phiên).
 *
 * <p>
 * Idempotent: nếu phiên đã có settlement thì bỏ qua, nên scheduler chạy lặp lại
 * vẫn an toàn.
 * </p>
 */
@Slf4j
@Service
public class AuctionSettlementServiceImpl implements AuctionSettlementService {

    private final AuctionRepository auctionRepository;
    private final BidRepository bidRepository;
    private final AuctionSettlementRepository settlementRepository;

    public AuctionSettlementServiceImpl(AuctionRepository auctionRepository, BidRepository bidRepository,
            AuctionSettlementRepository settlementRepository) {
        this.auctionRepository = auctionRepository;
        this.bidRepository = bidRepository;
        this.settlementRepository = settlementRepository;
    }

    @Override
    public Optional<AuctionSettlement> settle(UUID auctionId) {
        try {
            AuctionSettlement settlement = finalizeAuction(auctionId);
            if (settlement == null) {
                return Optional.empty();
            }
            // FR-36 — tạo Order loại AUCTION sẽ gọi module nexus-commerce ở giai đoạn
            // business logic.
            // Hiện tại chỉ ghi log để chứng minh luồng chốt phiên đã hoàn tất.
            log.info("FR-35: phiên {} đã chốt — settlement {} status {} winner {} finalPrice {} "
                    + "(FR-36 sẽ tạo Order AUCTION ở giai đoạn business logic)",
                    auctionId, settlement.getId(), settlement.getStatus(),
                    settlement.getWinnerId(), settlement.getFinalPrice());
            return Optional.of(settlement);
        } catch (RuntimeException ex) {
            // Cô lập lỗi từng phiên: một phiên hỏng không được làm dừng cả lượt chạy
            // scheduler.
            log.error("FR-35: không chốt được phiên {}", auctionId, ex);
            return Optional.empty();
        }
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public AuctionSettlement finalizeAuction(UUID auctionId) {
        // Idempotent: phiên đã có kết quả chốt thì không xử lý lại.
        if (settlementRepository.existsByAuctionId(auctionId)) {
            log.debug("FR-35: phiên {} đã có settlement, bỏ qua", auctionId);
            return null;
        }

        Auction auction = auctionRepository.findById(auctionId).orElse(null);
        if (auction == null) {
            log.warn("FR-35: không tìm thấy phiên {} để chốt", auctionId);
            return null;
        }
        if (auction.getStatus() != AuctionStatus.ENDED) {
            throw new BusinessException("Chỉ chốt được phiên đấu giá ở trạng thái ENDED");
        }

        // FR-35: winner = bid ACCEPTED có amount lớn nhất.
        Bid winningBid = bidRepository
                .findTopByAuctionIdAndStatusOrderByAmountDesc(auctionId, BidStatus.ACCEPTED)
                .orElse(null);

        AuctionSettlement.AuctionSettlementBuilder builder = AuctionSettlement.builder()
                .auctionId(auctionId)
                .settledAt(Instant.now())
                // orderId để trống — FR-36 (Order loại AUCTION) thuộc giai đoạn business logic.
                .orderId(null);

        if (winningBid == null) {
            // Không có bid ACCEPTED nào → phiên không có người thắng.
            builder.status(SettlementStatus.NO_BIDS)
                    .winnerId(null)
                    .finalPrice(null);
        } else {
            builder.status(SettlementStatus.WON)
                    .winnerId(winningBid.getBidderId())
                    .finalPrice(winningBid.getAmount());
        }

        return settlementRepository.save(builder.build());
    }
}
