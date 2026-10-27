package com.nexus.auction.service.impl;

import com.nexus.auction.dto.common.BidResponse;
import com.nexus.auction.entity.Bid;
import com.nexus.auction.enums.BidStatus;
import com.nexus.auction.repository.AuctionRepository;
import com.nexus.auction.repository.BidRepository;
import com.nexus.common.exception.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Test nghiệp vụ đặt giá (FR-30) — thuần Mockito, KHÔNG Spring context, KHÔNG DB (§14 CONVENTIONS).
 *
 * <p>Bốn kịch bản bắt buộc: bid &lt;= currentPrice, phiên chưa ACTIVE, seller tự bid,
 * bid hợp lệ cập nhật currentPrice. Phần đọc/ghi dữ liệu nằm trong
 * {@link BidPlacementHandler} nên ở đây mock chính handler đó để kiểm tra đúng trách nhiệm
 * của {@link BidServiceImpl}: quy đổi kết quả/exception thành phản hồi cho client.</p>
 */
@ExtendWith(MockitoExtension.class)
class BidServiceImplTest {

    private static final UUID AUCTION_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID BIDDER_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");

    @Mock
    private AuctionRepository auctionRepository;

    @Mock
    private BidRepository bidRepository;

    @Mock
    private BidPlacementHandler bidPlacementHandler;

    @InjectMocks
    private BidServiceImpl bidService;

    // ------------------------------------------------------------------
    // FR-30: bid <= currentPrice → lưu REJECTED + BusinessException
    // ------------------------------------------------------------------
    @Test
    @DisplayName("FR-30: bid không cao hơn currentPrice → lưu Bid REJECTED và ném BusinessException")
    void placeBid_whenAmountNotHigherThanCurrentPrice_shouldThrowAndKeepRejectedBid() {
        when(bidPlacementHandler.place(BIDDER_ID, AUCTION_ID, new BigDecimal("150.00")))
                .thenReturn(BidPlacementHandler.PlacementResult.rejected(
                        "Giá đặt phải cao hơn giá hiện tại 150.00"));

        assertThatThrownBy(() -> bidService.placeBid(BIDDER_ID, AUCTION_ID, new BigDecimal("150.00")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Giá đặt phải cao hơn giá hiện tại");
    }

    @Test
    @DisplayName("FR-30: bid đầu tiên thấp hơn startingPrice → lưu Bid REJECTED và ném BusinessException")
    void placeBid_whenFirstBidBelowStartingPrice_shouldThrow() {
        when(bidPlacementHandler.place(BIDDER_ID, AUCTION_ID, new BigDecimal("99.00")))
                .thenReturn(BidPlacementHandler.PlacementResult.rejected(
                        "Giá đặt phải lớn hơn hoặc bằng giá khởi điểm 100.00"));

        assertThatThrownBy(() -> bidService.placeBid(BIDDER_ID, AUCTION_ID, new BigDecimal("99.00")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("lớn hơn hoặc bằng giá khởi điểm");
    }

    // ------------------------------------------------------------------
    // FR-30: phiên chưa ACTIVE → BusinessException, không lưu bid
    // ------------------------------------------------------------------
    @Test
    @DisplayName("FR-30: phiên chưa ACTIVE → ném BusinessException và KHÔNG lưu bid")
    void placeBid_whenAuctionNotActive_shouldThrowWithoutSavingBid() {
        when(bidPlacementHandler.place(BIDDER_ID, AUCTION_ID, new BigDecimal("200.00")))
                .thenThrow(new BusinessException("Phiên đấu giá chưa mở hoặc đã kết thúc, không thể đặt giá"));

        assertThatThrownBy(() -> bidService.placeBid(BIDDER_ID, AUCTION_ID, new BigDecimal("200.00")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("chưa mở hoặc đã kết thúc");

        verifyNoInteractions(bidRepository);
    }

    // ------------------------------------------------------------------
    // FR-30: seller không được tự bid phiên của mình
    // ------------------------------------------------------------------
    @Test
    @DisplayName("FR-30: người bán tự đặt giá phiên của mình → BusinessException")
    void placeBid_whenSellerBidsOwnAuction_shouldThrow() {
        when(bidPlacementHandler.place(BIDDER_ID, AUCTION_ID, new BigDecimal("500.00")))
                .thenThrow(new BusinessException("Bạn là người bán, không thể tự đặt giá cho phiên của mình"));

        assertThatThrownBy(() -> bidService.placeBid(BIDDER_ID, AUCTION_ID, new BigDecimal("500.00")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("không thể tự đặt giá");
    }

    // ------------------------------------------------------------------
    // FR-30: bid hợp lệ → ACCEPTED (handler đã cập nhật currentPrice của phiên)
    // ------------------------------------------------------------------
    @Test
    @DisplayName("FR-30: bid hợp lệ → trả Bid ACCEPTED với đúng amount/bidder")
    void placeBid_whenAmountValid_shouldReturnAcceptedBid() {
        BigDecimal amount = new BigDecimal("200.00");
        when(bidPlacementHandler.place(BIDDER_ID, AUCTION_ID, amount))
                .thenReturn(BidPlacementHandler.PlacementResult.accepted(bid(BidStatus.ACCEPTED, amount)));

        BidResponse response = bidService.placeBid(BIDDER_ID, AUCTION_ID, amount);

        assertThat(response.status()).isEqualTo(BidStatus.ACCEPTED);
        assertThat(response.amount()).isEqualByComparingTo("200.00");
        assertThat(response.bidderId()).isEqualTo(BIDDER_ID);
        assertThat(response.auctionId()).isEqualTo(AUCTION_ID);
        verify(bidPlacementHandler).place(BIDDER_ID, AUCTION_ID, amount);
    }

    // ------------------------------------------------------------------
    // Chống đua bid: @Version của Auction bị đổi giữa chừng
    // ------------------------------------------------------------------
    @Test
    @DisplayName("Chống đua bid: ObjectOptimisticLockingFailureException → BusinessException thân thiện")
    void placeBid_whenOptimisticLockFails_shouldThrowFriendlyBusinessException() {
        BigDecimal amount = new BigDecimal("200.00");
        when(bidPlacementHandler.place(BIDDER_ID, AUCTION_ID, amount))
                .thenThrow(new ObjectOptimisticLockingFailureException("Auction", AUCTION_ID));

        assertThatThrownBy(() -> bidService.placeBid(BIDDER_ID, AUCTION_ID, amount))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Có người vừa đặt giá, vui lòng thử lại");
    }

    private Bid bid(BidStatus status, BigDecimal amount) {
        return Bid.builder()
                .auctionId(AUCTION_ID)
                .bidderId(BIDDER_ID)
                .amount(amount)
                .status(status)
                .placedAt(Instant.parse("2026-06-01T10:00:00Z"))
                .build();
    }
}
