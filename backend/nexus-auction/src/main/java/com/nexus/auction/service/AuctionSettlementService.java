package com.nexus.auction.service;

import com.nexus.auction.entity.AuctionSettlement;

import java.util.Optional;
import java.util.UUID;

/**
 * Nghiệp vụ chốt phiên — FR-34, FR-35.
 * Idempotent: mỗi phiên chỉ có MỘT settlement; lần chạy sau bỏ qua phiên đã chốt.
 */
public interface AuctionSettlementService {

    /**
     * Chốt phiên đã ENDED: xác định winner = bid ACCEPTED có amount lớn nhất, tạo settlement
     * {@code WON} (có bid) hoặc {@code NO_BIDS} (không có bid).
     *
     * @return settlement vừa tạo, hoặc rỗng nếu phiên đã chốt trước đó / phiên không tồn tại.
     */
    Optional<AuctionSettlement> settle(UUID auctionId);

    /**
     * Chốt phiên trong transaction riêng (REQUIRES_NEW) để một phiên lỗi không làm hỏng
     * cả lượt chạy scheduler. Ném BusinessException khi phiên chưa ở trạng thái ENDED.
     */
    AuctionSettlement finalizeAuction(UUID auctionId);
}
