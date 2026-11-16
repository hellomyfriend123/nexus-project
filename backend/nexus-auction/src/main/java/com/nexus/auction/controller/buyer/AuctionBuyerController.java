package com.nexus.auction.controller.buyer;

import com.nexus.auction.dto.buyer.PlaceBidRequest;
import com.nexus.auction.dto.common.BidResponse;
import com.nexus.auction.service.BidService;
import com.nexus.common.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** Endpoint đấu giá dành cho BUYER — FR-30. */
@RestController
@RequestMapping("/api/v1/buyer/auction/auctions")
@Tag(name = "Auction — Buyer", description = "FR-30")
public class AuctionBuyerController {

    private final BidService bidService;

    public AuctionBuyerController(BidService bidService) {
        this.bidService = bidService;
    }

    @PostMapping("/{id}/bids")
    @PreAuthorize("hasRole('BUYER')")
    @Operation(summary = "FR-30 — Buyer đặt giá vào phiên đang ACTIVE (amount > currentPrice)")
    @ApiResponse(responseCode = "201", description = "Đặt giá thành công (status ACCEPTED)")
    public ResponseEntity<BidResponse> placeBid(@PathVariable UUID id,
                                                @Valid @RequestBody PlaceBidRequest request) {
        // bidderId lấy từ token, KHÔNG nhận từ request body (§7.5).
        UUID bidderId = SecurityUtils.currentUserId();
        BidResponse response = bidService.placeBid(bidderId, id, request.amount());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
