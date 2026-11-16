package com.nexus.auction.service.impl;

import com.nexus.auction.dto.common.AuctionResponse;
import com.nexus.auction.entity.Auction;
import com.nexus.auction.enums.AuctionStatus;
import com.nexus.auction.repository.AuctionRepository;
import com.nexus.auction.repository.AuctionSettlementRepository;
import com.nexus.auction.repository.BidRepository;
import com.nexus.common.exception.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Test nghiệp vụ phiên đấu giá (FR-26, FR-27) — thuần Mockito, KHÔNG Spring context, KHÔNG DB (§14).
 */
@ExtendWith(MockitoExtension.class)
class AuctionServiceImplTest {

    private static final Instant START_TIME = Instant.parse("2026-01-01T00:00:00Z");
    private static final Instant END_TIME = Instant.parse("2026-12-31T00:00:00Z");

    @Mock
    private AuctionRepository auctionRepository;

    @Mock
    private BidRepository bidRepository;

    @Mock
    private AuctionSettlementRepository settlementRepository;

    @InjectMocks
    private AuctionServiceImpl auctionService;

    // ------------------------------------------------------------------
    // FR-27: không sửa được phiên đã ACTIVE
    // ------------------------------------------------------------------
    @Test
    @DisplayName("FR-27: sửa phiên đã ACTIVE → BusinessException, không ghi gì")
    void update_whenAuctionAlreadyActive_shouldThrowBusinessException() {
        UUID sellerId = UUID.randomUUID();
        UUID auctionId = UUID.randomUUID();
        Auction auction = auction(auctionId, sellerId, AuctionStatus.ACTIVE);

        when(auctionRepository.findById(auctionId)).thenReturn(Optional.of(auction));

        assertThatThrownBy(() -> auctionService.update(sellerId, auctionId, new BigDecimal("200.00"),
                START_TIME, END_TIME))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Không được sửa cấu hình khi phiên đã ACTIVE");

        verify(auctionRepository, never()).save(any(Auction.class));
    }

    // ------------------------------------------------------------------
    // FR-27: người khác không được sửa phiên
    // ------------------------------------------------------------------
    @Test
    @DisplayName("FR-27: người không sở hữu sửa phiên → BusinessException (403)")
    void update_whenNotOwner_shouldThrowForbidden() {
        UUID sellerId = UUID.randomUUID();
        UUID auctionId = UUID.randomUUID();
        Auction auction = auction(auctionId, UUID.randomUUID(), AuctionStatus.SCHEDULED);

        when(auctionRepository.findById(auctionId)).thenReturn(Optional.of(auction));

        assertThatThrownBy(() -> auctionService.update(sellerId, auctionId, new BigDecimal("200.00"),
                START_TIME, END_TIME))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("không phải chủ sở hữu");

        verify(auctionRepository, never()).save(any(Auction.class));
    }

    // ------------------------------------------------------------------
    // FR-26: product đã có phiên SCHEDULED/ACTIVE
    // ------------------------------------------------------------------
    @Test
    @DisplayName("FR-26: sản phẩm đã có phiên SCHEDULED/ACTIVE → BusinessException, không tạo phiên mới")
    void create_whenProductAlreadyHasRunningAuction_shouldThrowBusinessException() {
        UUID sellerId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();
        Auction running = auction(UUID.randomUUID(), UUID.randomUUID(), AuctionStatus.ACTIVE);

        when(auctionRepository.findFirstByProductIdAndStatusIn(eq(productId), anyCollection()))
                .thenReturn(Optional.of(running));

        assertThatThrownBy(() -> auctionService.create(sellerId, productId, new BigDecimal("100.00"),
                START_TIME, END_TIME))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("đã có phiên đấu giá");

        verify(auctionRepository, never()).save(any(Auction.class));
    }

    // ------------------------------------------------------------------
    // FR-26: thời gian không hợp lệ
    // ------------------------------------------------------------------
    @Test
    @DisplayName("FR-26: startTime không nhỏ hơn endTime → BusinessException")
    void create_whenStartTimeNotBeforeEndTime_shouldThrowBusinessException() {
        assertThatThrownBy(() -> auctionService.create(UUID.randomUUID(), UUID.randomUUID(),
                new BigDecimal("100.00"), END_TIME, START_TIME))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("startTime phải nhỏ hơn endTime");

        verify(auctionRepository, never()).save(any(Auction.class));
    }

    // ------------------------------------------------------------------
    // FR-26: tạo thành công → SCHEDULED, currentPrice = startingPrice
    // ------------------------------------------------------------------
    @Test
    @DisplayName("FR-26: tạo phiên hợp lệ → status SCHEDULED và currentPrice = startingPrice")
    void create_whenValid_shouldPersistScheduledAuction() {
        UUID sellerId = UUID.randomUUID();
        UUID productId = UUID.randomUUID();

        when(auctionRepository.findFirstByProductIdAndStatusIn(eq(productId), anyCollection()))
                .thenReturn(Optional.empty());
        when(auctionRepository.save(any(Auction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuctionResponse response = auctionService.create(sellerId, productId, new BigDecimal("100.00"),
                START_TIME, END_TIME);

        assertThat(response.productId()).isEqualTo(productId);
        assertThat(response.sellerId()).isEqualTo(sellerId);
        assertThat(response.status()).isEqualTo(AuctionStatus.SCHEDULED);
        assertThat(response.startingPrice()).isEqualByComparingTo("100.00");
        assertThat(response.currentPrice()).isEqualByComparingTo("100.00");
        assertThat(response.highestBidderId()).isNull();
        verify(auctionRepository).save(any(Auction.class));
    }

    // ------------------------------------------------------------------
    // FR-29: keyword tìm theo productId/sellerId phải là UUID
    // ------------------------------------------------------------------
    @Test
    @DisplayName("FR-29: keyword không phải UUID → BusinessException validate")
    void search_whenKeywordNotUuid_shouldThrowBusinessException() {
        assertThatThrownBy(() -> auctionService.search(null, "khong-phai-uuid", PageRequest.of(0, 10)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("keyword phải là UUID");

        verify(auctionRepository, never()).search(any(), any(), any(), any());
    }

    private Auction auction(UUID auctionId, UUID sellerId, AuctionStatus status) {
        Auction auction = Auction.builder()
                .productId(UUID.randomUUID())
                .sellerId(sellerId)
                .startingPrice(new BigDecimal("100.00"))
                .currentPrice(new BigDecimal("100.00"))
                .startTime(START_TIME)
                .endTime(END_TIME)
                .status(status)
                .build();
        auction.setId(auctionId);
        return auction;
    }
}
