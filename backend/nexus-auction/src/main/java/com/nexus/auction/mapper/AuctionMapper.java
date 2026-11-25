package com.nexus.auction.mapper;

import com.nexus.auction.dto.common.AdminAuctionResponse;
import com.nexus.auction.dto.common.AuctionResponse;
import com.nexus.auction.dto.common.AuctionSummaryResponse;
import com.nexus.auction.dto.common.BidResponse;
import com.nexus.auction.entity.Auction;

import java.util.List;

/** Mapper viết tay cho {@link Auction} (§9 CONVENTIONS) — không MapStruct, không reflection. */
public final class AuctionMapper {

    private AuctionMapper() {
    }

    /** FR-28: chi tiết phiên. */
    public static AuctionResponse toResponse(Auction entity, long acceptedBidCount) {
        return new AuctionResponse(
                entity.getId(),
                entity.getProductId(),
                entity.getSellerId(),
                entity.getStartingPrice(),
                entity.getCurrentPrice(),
                entity.getStartTime(),
                entity.getEndTime(),
                entity.getStatus(),
                entity.getHighestBidderId(),
                acceptedBidCount,
                entity.getCreatedAt(),
                entity.getUpdatedAt());
    }

    /** FR-29: một dòng trong danh sách phiên. */
    public static AuctionSummaryResponse toSummary(Auction entity) {
        return new AuctionSummaryResponse(
                entity.getId(),
                entity.getProductId(),
                entity.getSellerId(),
                entity.getStartingPrice(),
                entity.getCurrentPrice(),
                entity.getStartTime(),
                entity.getEndTime(),
                entity.getStatus(),
                entity.getHighestBidderId());
    }

    public static List<AuctionSummaryResponse> toSummaryList(List<Auction> entities) {
        return entities.stream().map(AuctionMapper::toSummary).toList();
    }

    /** FR-57: phiên kèm lịch sử bid cho Admin. */
    public static AdminAuctionResponse toAdminResponse(Auction entity, long bidCount, long acceptedBidCount,
                                                       List<BidResponse> bids) {
        return new AdminAuctionResponse(
                entity.getId(),
                entity.getProductId(),
                entity.getSellerId(),
                entity.getStartingPrice(),
                entity.getCurrentPrice(),
                entity.getStartTime(),
                entity.getEndTime(),
                entity.getStatus(),
                entity.getHighestBidderId(),
                bidCount,
                acceptedBidCount,
                bids == null ? List.of() : List.copyOf(bids));
    }
}
