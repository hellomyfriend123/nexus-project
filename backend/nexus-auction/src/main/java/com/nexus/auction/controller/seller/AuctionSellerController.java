package com.nexus.auction.controller.seller;

import com.nexus.auction.dto.common.AuctionResponse;
import com.nexus.auction.dto.seller.CreateAuctionRequest;
import com.nexus.auction.dto.seller.UpdateAuctionRequest;
import com.nexus.auction.service.AuctionService;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/** Endpoint đấu giá dành cho SELLER — FR-26, FR-27, FR-37. */
@RestController
@RequestMapping("/api/v1/seller/auction/auctions")
@Tag(name = "Auction — Seller", description = "FR-26, FR-27, FR-37")
public class AuctionSellerController {

    private final AuctionService auctionService;

    public AuctionSellerController(AuctionService auctionService) {
        this.auctionService = auctionService;
    }

    @PostMapping
    @PreAuthorize("hasRole('SELLER')")
    @Operation(summary = "FR-26 — Seller tạo phiên đấu giá cho sản phẩm của mình")
    @ApiResponse(responseCode = "201", description = "Tạo phiên thành công")
    public ResponseEntity<AuctionResponse> create(@Valid @RequestBody CreateAuctionRequest request) {
        // sellerId lấy từ token, KHÔNG nhận từ request body (§7.5).
        UUID sellerId = SecurityUtils.currentUserId();
        AuctionResponse response = auctionService.create(sellerId, request.productId(),
                request.startingPrice(), request.startTime(), request.endTime());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SELLER')")
    @Operation(summary = "FR-27 — Seller cấu hình lại phiên đấu giá (chỉ khi SCHEDULED)")
    @ApiResponse(responseCode = "200", description = "Cập nhật cấu hình thành công")
    public AuctionResponse update(@PathVariable UUID id,
                                  @Valid @RequestBody UpdateAuctionRequest request) {
        UUID sellerId = SecurityUtils.currentUserId();
        return auctionService.update(sellerId, id, request.startingPrice(),
                request.startTime(), request.endTime());
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('SELLER')")
    @Operation(summary = "FR-37 — Seller hủy phiên đấu giá của mình")
    @ApiResponse(responseCode = "200", description = "Hủy phiên thành công")
    public AuctionResponse cancel(@PathVariable UUID id) {
        UUID sellerId = SecurityUtils.currentUserId();
        return auctionService.cancelBySeller(sellerId, id);
    }
}
