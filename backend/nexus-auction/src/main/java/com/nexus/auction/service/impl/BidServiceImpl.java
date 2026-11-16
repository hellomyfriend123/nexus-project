package com.nexus.auction.service.impl;

import com.nexus.auction.dto.common.BidResponse;
import com.nexus.auction.entity.Bid;
import com.nexus.auction.enums.BidStatus;
import com.nexus.auction.mapper.BidMapper;
import com.nexus.auction.repository.AuctionRepository;
import com.nexus.auction.repository.BidRepository;
import com.nexus.auction.service.BidService;
import com.nexus.common.api.ErrorCode;
import com.nexus.common.api.PageResponse;
import com.nexus.common.exception.BusinessException;
import com.nexus.common.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Cài đặt {@link BidService} — FR-30, FR-31.
 *
 * <p><b>Chống đua bid:</b> {@link com.nexus.auction.entity.Auction} có {@code @Version}.
 * Khi hai Buyer cùng đọc một phiên, lượt ghi sau nhận {@link OptimisticLockingFailureException}
 * lúc flush; {@link #placeBid} cố ý KHÔNG mang {@code @Transactional} nên bắt được exception
 * NGOÀI ranh giới transaction (transaction ghi của {@link BidPlacementHandler} đã rollback sạch)
 * và đổi thành thông báo thân thiện "Có người vừa đặt giá, vui lòng thử lại".</p>
 */
@Slf4j
@Service
public class BidServiceImpl implements BidService {

    private final AuctionRepository auctionRepository;
    private final BidRepository bidRepository;
    private final BidPlacementHandler bidPlacementHandler;

    public BidServiceImpl(AuctionRepository auctionRepository, BidRepository bidRepository,
            BidPlacementHandler bidPlacementHandler) {
        this.auctionRepository = auctionRepository;
        this.bidRepository = bidRepository;
        this.bidPlacementHandler = bidPlacementHandler;
    }

    // ------------------------------------------------------------------
    // FR-30 — đặt giá
    // ------------------------------------------------------------------
    @Override
    public BidResponse placeBid(UUID bidderId, UUID auctionId, BigDecimal amount) {
        BidPlacementHandler.PlacementResult result;
        try {
            result = bidPlacementHandler.place(bidderId, auctionId, amount);
        } catch (OptimisticLockingFailureException ex) {
            // Có buyer khác vừa ghi currentPrice/highestBidderId trước khi lượt này flush.
            log.warn("FR-30: phát hiện ghi đè đồng thời trên phiên {} (bidder {})", auctionId, bidderId);
            throw new BusinessException(ErrorCode.CONFLICT, "Có người vừa đặt giá, vui lòng thử lại");
        }

        // Bid không hợp lệ: đã được lưu với status REJECTED trong transaction riêng (FR-30),
        // giờ mới báo lỗi cho client để bản ghi REJECTED không bị rollback.
        if (result.isRejected()) {
            throw new BusinessException(result.rejectionMessage());
        }

        // TODO (FR-32 — giai đoạn business logic): gọi module nexus-notification để phát BID_PLACED
        //  và OUTBID cho người bị vượt giá.
        return BidMapper.toResponse(result.acceptedBid());
    }

    // ------------------------------------------------------------------
    // FR-31 — lịch sử bid
    // ------------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public PageResponse<BidResponse> findAcceptedBids(UUID auctionId, Pageable pageable) {
        if (!auctionRepository.existsById(auctionId)) {
            throw new ResourceNotFoundException("Phiên đấu giá", auctionId);
        }
        // FR-31: luôn sắp xếp mới nhất trước, không phụ thuộc tham số sort của client.
        Pageable newestFirst = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
                Sort.by(Sort.Direction.DESC, "placedAt"));
        Page<Bid> page = bidRepository.findByAuctionIdAndStatusOrderByPlacedAtDesc(
                auctionId, BidStatus.ACCEPTED, newestFirst);
        return PageResponse.from(page, BidMapper::toResponse);
    }
}
