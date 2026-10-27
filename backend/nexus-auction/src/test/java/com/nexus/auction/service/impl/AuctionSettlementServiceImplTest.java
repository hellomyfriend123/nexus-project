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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Test nghiệp vụ chốt phiên (FR-35) — thuần Mockito, KHÔNG Spring context, KHÔNG DB (§14 CONVENTIONS).
 */
@ExtendWith(MockitoExtension.class)
class AuctionSettlementServiceImplTest {

    @Mock
    private AuctionRepository auctionRepository;

    @Mock
    private BidRepository bidRepository;

    @Mock
    private AuctionSettlementRepository settlementRepository;

    @InjectMocks
    private AuctionSettlementServiceImpl settlementService;

    @Test
    @DisplayName("FR-35: phiên ENDED có bid ACCEPTED → settlement WON với winner và finalPrice")
    void finalizeAuction_whenHasAcceptedBid_shouldCreateWonSettlement() {
        UUID auctionId = UUID.randomUUID();
        UUID winnerId = UUID.randomUUID();
        Auction auction = endedAuction(auctionId);
        Bid winningBid = Bid.builder()
                .auctionId(auctionId)
                .bidderId(winnerId)
                .amount(new BigDecimal("250.00"))
                .status(BidStatus.ACCEPTED)
                .placedAt(Instant.now())
                .build();

        when(settlementRepository.existsByAuctionId(auctionId)).thenReturn(false);
        when(auctionRepository.findById(auctionId)).thenReturn(Optional.of(auction));
        when(bidRepository.findTopByAuctionIdAndStatusOrderByAmountDesc(auctionId, BidStatus.ACCEPTED))
                .thenReturn(Optional.of(winningBid));
        when(settlementRepository.save(any(AuctionSettlement.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        AuctionSettlement settlement = settlementService.finalizeAuction(auctionId);

        assertThat(settlement).isNotNull();
        assertThat(settlement.getStatus()).isEqualTo(SettlementStatus.WON);
        assertThat(settlement.getWinnerId()).isEqualTo(winnerId);
        assertThat(settlement.getFinalPrice()).isEqualByComparingTo("250.00");
        // FR-36 chưa làm nên orderId phải để trống.
        assertThat(settlement.getOrderId()).isNull();
        assertThat(settlement.getSettledAt()).isNotNull();
    }

    @Test
    @DisplayName("FR-35: phiên ENDED không có bid → settlement NO_BIDS")
    void finalizeAuction_whenNoAcceptedBid_shouldCreateNoBidsSettlement() {
        UUID auctionId = UUID.randomUUID();
        Auction auction = endedAuction(auctionId);

        when(settlementRepository.existsByAuctionId(auctionId)).thenReturn(false);
        when(auctionRepository.findById(auctionId)).thenReturn(Optional.of(auction));
        when(bidRepository.findTopByAuctionIdAndStatusOrderByAmountDesc(auctionId, BidStatus.ACCEPTED))
                .thenReturn(Optional.empty());
        when(settlementRepository.save(any(AuctionSettlement.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        AuctionSettlement settlement = settlementService.finalizeAuction(auctionId);

        assertThat(settlement).isNotNull();
        assertThat(settlement.getStatus()).isEqualTo(SettlementStatus.NO_BIDS);
        assertThat(settlement.getWinnerId()).isNull();
        assertThat(settlement.getFinalPrice()).isNull();
    }

    @Test
    @DisplayName("FR-35 idempotent: phiên đã có settlement → bỏ qua, không tạo thêm")
    void finalizeAuction_whenSettlementAlreadyExists_shouldBeIdempotent() {
        UUID auctionId = UUID.randomUUID();

        when(settlementRepository.existsByAuctionId(auctionId)).thenReturn(true);

        assertThat(settlementService.finalizeAuction(auctionId)).isNull();
        verify(settlementRepository, never()).save(any(AuctionSettlement.class));
        verify(auctionRepository, never()).findById(any(UUID.class));
    }

    private Auction endedAuction(UUID auctionId) {
        Auction auction = Auction.builder()
                .productId(UUID.randomUUID())
                .sellerId(UUID.randomUUID())
                .startingPrice(new BigDecimal("100.00"))
                .currentPrice(new BigDecimal("250.00"))
                .startTime(Instant.parse("2026-01-01T00:00:00Z"))
                .endTime(Instant.parse("2026-01-02T00:00:00Z"))
                .status(AuctionStatus.ENDED)
                .build();
        auction.setId(auctionId);
        return auction;
    }
}
