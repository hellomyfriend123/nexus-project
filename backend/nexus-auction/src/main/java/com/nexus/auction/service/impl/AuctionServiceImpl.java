package com.nexus.auction.service.impl;

import com.nexus.auction.dto.common.AdminAuctionResponse;
import com.nexus.auction.dto.common.AuctionResponse;
import com.nexus.auction.dto.common.AuctionSummaryResponse;
import com.nexus.auction.dto.common.BidResponse;
import com.nexus.auction.dto.common.SettlementResponse;
import com.nexus.auction.entity.Auction;
import com.nexus.auction.entity.AuctionSettlement;
import com.nexus.auction.enums.AuctionStatus;
import com.nexus.auction.enums.BidStatus;
import com.nexus.auction.mapper.AuctionMapper;
import com.nexus.auction.mapper.AuctionSettlementMapper;
import com.nexus.auction.mapper.BidMapper;
import com.nexus.auction.repository.AuctionRepository;
import com.nexus.auction.repository.AuctionSettlementRepository;
import com.nexus.auction.repository.BidRepository;
import com.nexus.auction.service.AuctionService;
import com.nexus.common.api.ErrorCode;
import com.nexus.common.api.PageResponse;
import com.nexus.common.exception.BusinessException;
import com.nexus.common.exception.ForbiddenOperationException;
import com.nexus.common.exception.ResourceNotFoundException;
import lombok.Builder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Cài đặt {@link AuctionService} — FR-26 → FR-29, FR-33, FR-34, FR-35, FR-37, FR-57.
 */
@Slf4j
@Service
@Builder 
public class AuctionServiceImpl implements AuctionService {

    /** Trạng thái được coi là "phiên đang chạy" khi kiểm tra trùng sản phẩm (FR-26). */
    private static final List<AuctionStatus> RUNNING_STATUSES =
            List.of(AuctionStatus.SCHEDULED, AuctionStatus.ACTIVE);

    /** Số bid tối đa trả kèm cho mỗi phiên ở màn hình Admin (FR-57). */
    private static final int ADMIN_BID_HISTORY_LIMIT = 50;

    private final AuctionRepository auctionRepository;
    private final BidRepository bidRepository;
    private final AuctionSettlementRepository settlementRepository;

    public AuctionServiceImpl(AuctionRepository auctionRepository, BidRepository bidRepository,
            AuctionSettlementRepository settlementRepository) {
        this.auctionRepository = auctionRepository;
        this.bidRepository = bidRepository;
        this.settlementRepository = settlementRepository;
    }

    // ------------------------------------------------------------------
    // FR-26 — tạo phiên
    // ------------------------------------------------------------------
    @Override
    @Transactional
    public AuctionResponse create(UUID sellerId, UUID productId, BigDecimal startingPrice,
                                  Instant startTime, Instant endTime) {
        if (productId == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "productId không được để trống");
        }
        validatePriceAndTime(startingPrice, startTime, endTime);
        ensureProductHasNoRunningAuction(productId);

        Auction auction = Auction.builder()
                .productId(productId)
                .sellerId(sellerId)
                .startingPrice(startingPrice)
                .currentPrice(startingPrice)
                .highestBidderId(null)
                .startTime(startTime)
                .endTime(endTime)
                .status(AuctionStatus.SCHEDULED)
                .build();
        Auction saved = auctionRepository.save(auction);
        log.info("FR-26: Seller {} đã tạo phiên đấu giá {} cho sản phẩm {}", sellerId, saved.getId(), productId);
        return AuctionMapper.toResponse(saved, 0L);
    }

    // ------------------------------------------------------------------
    // FR-27 — cấu hình lại phiên
    // ------------------------------------------------------------------
    @Override
    @Transactional
    public AuctionResponse update(UUID sellerId, UUID auctionId, BigDecimal startingPrice,
                                  Instant startTime, Instant endTime) {
        Auction auction = findAuction(auctionId);
        ensureOwner(auction, sellerId);
        if (auction.getStatus() != AuctionStatus.SCHEDULED) {
            throw new BusinessException("Không được sửa cấu hình khi phiên đã ACTIVE");
        }
        validatePriceAndTime(startingPrice, startTime, endTime);

        auction.setStartingPrice(startingPrice);
        // Chưa có bid nào (vì còn SCHEDULED) nên giá hiện tại bám theo giá khởi điểm mới.
        auction.setCurrentPrice(startingPrice);
        auction.setStartTime(startTime);
        auction.setEndTime(endTime);

        Auction saved = auctionRepository.save(auction);
        log.info("FR-27: Seller {} đã cập nhật cấu hình phiên {}", sellerId, auctionId);
        return AuctionMapper.toResponse(saved, countAcceptedBids(auctionId));
    }

    // ------------------------------------------------------------------
    // FR-28 — chi tiết phiên
    // ------------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public AuctionResponse getById(UUID auctionId) {
        Auction auction = findAuction(auctionId);
        return AuctionMapper.toResponse(auction, countAcceptedBids(auctionId));
    }

    // ------------------------------------------------------------------
    // FR-29 — danh sách phiên
    // ------------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public PageResponse<AuctionSummaryResponse> search(String status, String keyword, Pageable pageable) {
        Page<Auction> page = runSearch(status, keyword, pageable);
        return PageResponse.from(page, AuctionMapper::toSummary);
    }

    // ------------------------------------------------------------------
    // FR-57 — Admin xem toàn bộ phiên + lịch sử bid
    // ------------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminAuctionResponse> listForAdmin(String status, String keyword, Pageable pageable) {
        // status/keyword null → bỏ qua điều kiện lọc tương ứng, tức là "xem tất cả".
        return toAdminPage(runSearch(status, keyword, pageable));
    }

    /** FR-29/FR-57: chọn query phù hợp với tổ hợp bộ lọc đang có. */
    private Page<Auction> runSearch(String status, String keyword, Pageable pageable) {
        AuctionStatus parsedStatus = parseStatus(status);
        UUID parsedKeyword = parseKeyword(keyword);
        if (parsedKeyword == null) {
            return auctionRepository.search(parsedStatus, null, null, pageable);
        }
        return parsedStatus == null
                ? auctionRepository.searchByKeyword(parsedKeyword, pageable)
                : auctionRepository.searchByStatusAndKeyword(parsedStatus, parsedKeyword, pageable);
    }

    /** Ghép thông tin phiên + lịch sử bid cho từng dòng (FR-57). */
    private PageResponse<AdminAuctionResponse> toAdminPage(Page<Auction> page) {
        List<AdminAuctionResponse> content = new ArrayList<>(page.getNumberOfElements());
        for (Auction auction : page.getContent()) {
            UUID id = auction.getId();
            List<BidResponse> bids = BidMapper.toResponseList(bidRepository
                    .findByAuctionIdAndStatusOrderByPlacedAtDesc(id, BidStatus.ACCEPTED,
                            PageRequest.of(0, ADMIN_BID_HISTORY_LIMIT))
                    .getContent());
            long accepted = bidRepository.countByAuctionIdAndStatus(id, BidStatus.ACCEPTED);
            long total = bidRepository.findByAuctionIdOrderByPlacedAtDesc(id).size();
            content.add(AuctionMapper.toAdminResponse(auction, total, accepted, bids));
        }
        return PageResponse.of(content, page.getNumber(), page.getSize(), page.getTotalElements());
    }

    // ------------------------------------------------------------------
    // FR-37 — hủy phiên
    // ------------------------------------------------------------------
    @Override
    @Transactional
    public AuctionResponse cancelBySeller(UUID sellerId, UUID auctionId) {
        Auction auction = findAuction(auctionId);
        ensureOwner(auction, sellerId);
        return doCancel(auction, "Seller " + sellerId);
    }

    @Override
    @Transactional
    public AuctionResponse cancelByAdmin(UUID auctionId) {
        Auction auction = findAuction(auctionId);
        return doCancel(auction, "Admin");
    }

    // ------------------------------------------------------------------
    // Kết quả chốt phiên
    // ------------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public SettlementResponse getSettlement(UUID auctionId) {
        findAuction(auctionId);
        AuctionSettlement settlement = settlementRepository.findByAuctionId(auctionId)
                .orElseThrow(() -> new ResourceNotFoundException("Kết quả chốt phiên đấu giá", auctionId));
        return AuctionSettlementMapper.toResponse(settlement,
                bidRepository.countByAuctionIdAndStatus(auctionId, BidStatus.ACCEPTED));
    }

    // ------------------------------------------------------------------
    // FR-33 — mở phiên
    // ------------------------------------------------------------------
    @Override
    @Transactional
    public List<UUID> activateDueAuctions() {
        List<Auction> due = auctionRepository.findByStatusAndStartTimeLessThanEqual(
                AuctionStatus.SCHEDULED, Instant.now());
        List<UUID> activated = new ArrayList<>(due.size());
        for (Auction auction : due) {
            auction.setStatus(AuctionStatus.ACTIVE);
            auctionRepository.save(auction);
            activated.add(auction.getId());
            log.info("FR-33: phiên {} chuyển SCHEDULED → ACTIVE", auction.getId());
            // TODO (giai đoạn business logic): gọi module nexus-notification để phát AUCTION_STARTED
            //  cho seller và những buyer đang quan tâm sản phẩm.
        }
        return activated;
    }

    // ------------------------------------------------------------------
    // FR-34 — đóng phiên (chốt người thắng do AuctionSettlementService đảm nhiệm — FR-35)
    // ------------------------------------------------------------------
    @Override
    @Transactional
    public List<UUID> closeExpiredAuctions() {
        List<Auction> expired = auctionRepository.findByStatusAndEndTimeLessThanEqual(
                AuctionStatus.ACTIVE, Instant.now());
        List<UUID> closed = new ArrayList<>(expired.size());
        for (Auction auction : expired) {
            auction.setStatus(AuctionStatus.ENDED);
            auctionRepository.save(auction);
            closed.add(auction.getId());
            log.info("FR-34: phiên {} chuyển ACTIVE → ENDED", auction.getId());
            // TODO (giai đoạn business logic): gọi nexus-notification để phát AUCTION_ENDED.
        }
        return closed;
    }

    // ------------------------------------------------------------------
    // FR-35 — danh sách phiên cần chốt (chưa có settlement)
    // ------------------------------------------------------------------
    @Override
    @Transactional(readOnly = true)
    public List<UUID> findUnsettledEndedAuctionIds() {
        return auctionRepository.findByStatus(AuctionStatus.ENDED).stream()
                .filter(auction -> !settlementRepository.existsByAuctionId(auction.getId()))
                .map(auction -> auction.getId())
                .toList();
    }

    // ------------------------------------------------------------------
    // Hàm dùng chung
    // ------------------------------------------------------------------

    private AuctionResponse doCancel(Auction auction, String actor) {
        if (auction.getStatus() != AuctionStatus.SCHEDULED && auction.getStatus() != AuctionStatus.ACTIVE) {
            throw new BusinessException("Chỉ được hủy phiên đang ở trạng thái SCHEDULED hoặc ACTIVE");
        }
        auction.setStatus(AuctionStatus.CANCELLED);
        Auction saved = auctionRepository.save(auction);
        log.info("FR-37: {} đã hủy phiên {}", actor, auction.getId());
        // TODO (giai đoạn business logic): gọi nexus-notification để phát AUCTION_CANCELLED
        //  cho seller và toàn bộ bidder đã tham gia.
        return AuctionMapper.toResponse(saved, countAcceptedBids(auction.getId()));
    }

    /** Validate chung cho FR-26/FR-27. */
    private void validatePriceAndTime(BigDecimal startingPrice, Instant startTime, Instant endTime) {
        if (startingPrice == null || startingPrice.signum() <= 0) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "startingPrice phải lớn hơn 0");
        }
        if (startTime == null || endTime == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "startTime và endTime không được để trống");
        }
        if (!startTime.isBefore(endTime)) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "startTime phải nhỏ hơn endTime");
        }
    }

    /**
     * FR-26: một sản phẩm chỉ được có tối đa một phiên SCHEDULED/ACTIVE.
     * Kiểm tra hoàn toàn trong bảng {@code nexus_auction.auctions} của module này
     * (không gọi sang nexus-catalog ở giai đoạn CRUD).
     */
    private void ensureProductHasNoRunningAuction(UUID productId) {
        auctionRepository.findFirstByProductIdAndStatusIn(productId, RUNNING_STATUSES)
                .ifPresent(existing -> {
                    throw new BusinessException(ErrorCode.CONFLICT,
                            "Sản phẩm đã có phiên đấu giá đang chờ hoặc đang diễn ra: " + existing.getId());
                });
    }

    private void ensureOwner(Auction auction, UUID sellerId) {
        if (!auction.getSellerId().equals(sellerId)) {
            throw new ForbiddenOperationException("Bạn không phải chủ sở hữu phiên đấu giá này");
        }
    }

    private Auction findAuction(UUID auctionId) {
        return auctionRepository.findById(auctionId)
                .orElseThrow(() -> new ResourceNotFoundException("Phiên đấu giá", auctionId));
    }

    private long countAcceptedBids(UUID auctionId) {
        return bidRepository.countByAuctionIdAndStatus(auctionId, BidStatus.ACCEPTED);
    }

    /** Chuyển status dạng chuỗi từ query param sang enum; giá trị sai → lỗi validate rõ ràng. */
    private AuctionStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return AuctionStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "status không hợp lệ: " + status + " (chỉ nhận SCHEDULED, ACTIVE, ENDED, CANCELLED)");
        }
    }

    /**
     * FR-29: keyword tìm theo productId/sellerId nên phải là UUID hợp lệ.
     * Giá trị không phải UUID → lỗi validate rõ ràng (không âm thầm bỏ qua bộ lọc).
     */
    private UUID parseKeyword(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(keyword.trim());
        } catch (IllegalArgumentException ex) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR,
                    "keyword phải là UUID của productId hoặc sellerId: " + keyword);
        }
    }
}
