package com.nexus.auction.mapper;

import com.nexus.auction.dto.common.SettlementResponse;
import com.nexus.auction.entity.AuctionSettlement;

/** Mapper viết tay cho {@link AuctionSettlement} (§9 CONVENTIONS). */
public final class AuctionSettlementMapper {

    private AuctionSettlementMapper() {
    }

    /** FR-35: kết quả chốt phiên (winner, finalPrice, status). */
    public static SettlementResponse toResponse(AuctionSettlement entity, long bidCount) {
        return new SettlementResponse(
                entity.getId(),
                entity.getAuctionId(),
                entity.getWinnerId(),
                entity.getOrderId(),
                entity.getFinalPrice(),
                entity.getStatus(),
                entity.getSettledAt(),
                bidCount);
    }
}
