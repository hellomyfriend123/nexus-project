package com.nexus.auction.controller.common;

import com.nexus.auction.dto.common.AuctionResponse;
import com.nexus.auction.dto.common.AuctionSummaryResponse;
import com.nexus.auction.dto.common.BidResponse;
import com.nexus.auction.dto.common.SettlementResponse;
import com.nexus.auction.service.AuctionService;
import com.nexus.auction.service.BidService;
import com.nexus.common.api.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Endpoint đấu giá dùng chung cho cả 3 role đã đăng nhập — FR-28, FR-29, FR-31.
 * Đặt ở {@code controller/common} vì FR ghi nhiều actor (§3 CONVENTIONS), KHÔNG nhân bản theo role.
 */
@RestController
@RequestMapping("/api/v1/auction/auctions")
@Tag(name = "Auction — Common", description = "FR-28, FR-29, FR-31")
public class AuctionQueryController {

    private final AuctionService auctionService;
    private final BidService bidService;

    public AuctionQueryController(AuctionService auctionService, BidService bidService) {
        this.auctionService = auctionService;
        this.bidService = bidService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "FR-29 — Danh sách phiên đấu giá (lọc theo status, keyword)")
    @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công")
    public PageResponse<AuctionSummaryResponse> list(@RequestParam(required = false) String status,
                                                     @RequestParam(required = false) String keyword,
                                                     Pageable pageable) {
        return auctionService.search(status, keyword, pageable);
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "FR-28 — Xem chi tiết phiên đấu giá")
    @ApiResponse(responseCode = "200", description = "Lấy chi tiết thành công")
    public AuctionResponse detail(@PathVariable UUID id) {
        return auctionService.getById(id);
    }

    @GetMapping("/{id}/bids")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "FR-31 — Lịch sử đặt giá của phiên (chỉ bid ACCEPTED, mới nhất trước)")
    @ApiResponse(responseCode = "200", description = "Lấy lịch sử bid thành công")
    public PageResponse<BidResponse> bidHistory(@PathVariable UUID id, Pageable pageable) {
        return bidService.findAcceptedBids(id, pageable);
    }

    @GetMapping("/{id}/settlement")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "FR-35 — Xem kết quả chốt phiên (winner, finalPrice, status)")
    @ApiResponse(responseCode = "200", description = "Lấy kết quả chốt thành công")
    public SettlementResponse settlement(@PathVariable UUID id) {
        return auctionService.getSettlement(id);
    }
}
