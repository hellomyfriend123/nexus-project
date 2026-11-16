package com.nexus.catalog.controller.buyer;

import com.nexus.catalog.dto.buyer.CreateReviewRequest;
import com.nexus.catalog.dto.common.ReviewResponse;
import com.nexus.catalog.service.ProductReviewService;
import com.nexus.common.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Endpoint Buyer đánh giá sản phẩm.
 * {@code buyerId} luôn lấy từ token ({@link SecurityUtils#currentUserId()}).
 */
@RestController
@RequestMapping("/api/v1/buyer/catalog/products")
@Tag(name = "Catalog — Buyer", description = "FR-41, FR-42")
@PreAuthorize("hasRole('BUYER')")
@RequiredArgsConstructor
public class CatalogBuyerController {

    private final ProductReviewService productReviewService;

    @PostMapping("/{id}/reviews")
    @Operation(summary = "FR-41/FR-42 — Buyer đánh giá sản phẩm (score 1..5)")
    @ApiResponse(responseCode = "201", description = "Tạo đánh giá thành công")
    public ResponseEntity<ReviewResponse> createReview(@PathVariable UUID id,
                                                       @Valid @RequestBody CreateReviewRequest request) {
        UUID buyerId = SecurityUtils.currentUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(productReviewService.create(buyerId, id, request));
    }
}
