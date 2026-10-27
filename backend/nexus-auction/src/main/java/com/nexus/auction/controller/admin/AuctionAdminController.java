package com.nexus.auction.controller.admin;

import com.nexus.auction.dto.common.AdminAuctionResponse;
import com.nexus.auction.dto.common.AuctionResponse;
import com.nexus.auction.service.AuctionService;
import com.nexus.common.api.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** Endpoint đấu giá dành cho ADMIN — FR-37, FR-57. */
@RestController
@RequestMapping("/api/v1/admin/auction/auctions")
@Tag(name = "Auction — Admin", description = "FR-37, FR-57")
public class AuctionAdminController {

    private final AuctionService auctionService;

    public AuctionAdminController(AuctionService auctionService) {
        this.auctionService = auctionService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "FR-57 — Admin xem toàn bộ phiên đấu giá kèm lịch sử bid")
    @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công")
    public PageResponse<AdminAuctionResponse> list(@RequestParam(required = false) String status,
                                                   @RequestParam(required = false) String keyword,
                                                   Pageable pageable) {
        return auctionService.listForAdmin(status, keyword, pageable);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "FR-37 — Admin hủy phiên đấu giá")
    @ApiResponse(responseCode = "200", description = "Hủy phiên thành công")
    public AuctionResponse cancel(@PathVariable UUID id) {
        return auctionService.cancelByAdmin(id);
    }
}
