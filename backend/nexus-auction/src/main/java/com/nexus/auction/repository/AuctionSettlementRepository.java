package com.nexus.auction.repository;

import com.nexus.auction.entity.AuctionSettlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/** Truy cập bảng {@code nexus_auction.auction_settlements} (FR-35). */
@Repository
public interface AuctionSettlementRepository extends JpaRepository<AuctionSettlement, UUID> {

    Optional<AuctionSettlement> findByAuctionId(UUID auctionId);

    boolean existsByAuctionId(UUID auctionId);
}
