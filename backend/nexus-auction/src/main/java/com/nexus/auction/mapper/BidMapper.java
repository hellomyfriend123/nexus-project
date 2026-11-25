package com.nexus.auction.mapper;

import com.nexus.auction.dto.common.BidResponse;
import com.nexus.auction.entity.Bid;

import java.util.List;

/** Mapper viết tay cho {@link Bid} (§9 CONVENTIONS). */
public final class BidMapper {

    private BidMapper() {
    }

    /** FR-30 / FR-31: một lượt đặt giá. */
    public static BidResponse toResponse(Bid entity) {
        return new BidResponse(
                entity.getId(),
                entity.getAuctionId(),
                entity.getBidderId(),
                entity.getAmount(),
                entity.getStatus(),
                entity.getPlacedAt());
    }

    public static List<BidResponse> toResponseList(List<Bid> entities) {
        return entities.stream().map(BidMapper::toResponse).toList();
    }
}
