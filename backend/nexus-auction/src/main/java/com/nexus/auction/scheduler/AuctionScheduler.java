package com.nexus.auction.scheduler;

import com.nexus.auction.service.AuctionService;
import com.nexus.auction.service.AuctionSettlementService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Tác vụ định kỳ của module đấu giá — FR-33, FR-34, FR-35 (và điểm nối FR-36).
 *
 * <p>Mỗi lượt chạy gồm 3 bước theo đúng thứ tự phụ thuộc:</p>
 * <ol>
 *   <li>FR-33: phiên {@code SCHEDULED} đã tới {@code startTime} → {@code ACTIVE}.</li>
 *   <li>FR-34: phiên {@code ACTIVE} đã quá {@code endTime} → {@code ENDED}.</li>
 *   <li>FR-35: chốt người thắng cho các phiên {@code ENDED} chưa có settlement (idempotent).</li>
 * </ol>
 *
 * <p>Chu kỳ lấy từ cấu hình {@code nexus.auction.scheduler-interval-ms} (mặc định 15000 ms).
 * {@code @EnableScheduling} đã được bật ở nexus-app — module này KHÔNG bật lại.</p>
 */
@Slf4j
@Component
public class AuctionScheduler {

    private final AuctionService auctionService;
    private final AuctionSettlementService settlementService;

    public AuctionScheduler(AuctionService auctionService, AuctionSettlementService settlementService) {
        this.auctionService = auctionService;
        this.settlementService = settlementService;
    }

    @Scheduled(fixedDelayString = "${nexus.auction.scheduler-interval-ms:15000}")
    public void runAuctionLifecycle() {
        try {
            activateDueAuctions();
            closeExpiredAuctions();
            settleEndedAuctions();
        } catch (RuntimeException ex) {
            // Không để exception thoát ra khỏi tác vụ định kỳ: lần chạy sau vẫn phải tiếp tục.
            log.error("Lỗi khi chạy tác vụ vòng đời đấu giá", ex);
        }
    }

    /** FR-33 — mở các phiên đã tới giờ bắt đầu. */
    public void activateDueAuctions() {
        List<UUID> activated = auctionService.activateDueAuctions();
        if (!activated.isEmpty()) {
            log.info("FR-33: đã mở {} phiên đấu giá: {}", activated.size(), activated);
        }
    }

    /** FR-34 — đóng các phiên đã quá giờ kết thúc. */
    public void closeExpiredAuctions() {
        List<UUID> closed = auctionService.closeExpiredAuctions();
        if (!closed.isEmpty()) {
            log.info("FR-34: đã đóng {} phiên đấu giá: {}", closed.size(), closed);
        }
    }

    /** FR-35 — xác định người thắng và tạo settlement cho các phiên chưa chốt. */
    public void settleEndedAuctions() {
        List<UUID> candidates = auctionService.findUnsettledEndedAuctionIds();
        if (candidates.isEmpty()) {
            return;
        }
        for (UUID auctionId : candidates) {
            // settle() đã cô lập lỗi từng phiên; rỗng nghĩa là phiên đã chốt trước đó hoặc bị lỗi.
            settlementService.settle(auctionId).ifPresent(settlement ->
                    log.info("FR-35: phiên {} đã chốt với status {}", auctionId, settlement.getStatus()));
        }
        // TODO (FR-36 — giai đoạn business logic): với settlement WON, gọi module nexus-commerce
        //  để tạo Order loại AUCTION (OrderType.AUCTION) cho winner, rồi cập nhật
        //  AuctionSettlement.orderId và phát thông báo AUCTION_WON / AUCTION_FAILED qua
        //  module nexus-notification. Giai đoạn CRUD này chỉ log ra console.
    }
}
