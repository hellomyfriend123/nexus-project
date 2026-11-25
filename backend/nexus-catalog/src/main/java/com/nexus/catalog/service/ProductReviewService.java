package com.nexus.catalog.service;

import com.nexus.catalog.dto.admin.UpdateReviewStatusRequest;
import com.nexus.catalog.dto.buyer.CreateReviewRequest;
import com.nexus.catalog.dto.common.ReviewResponse;
import com.nexus.catalog.enums.ReviewStatus;
import com.nexus.common.api.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Nghiệp vụ đánh giá sản phẩm — FR-41, FR-42, FR-45, FR-59.
 */
public interface ProductReviewService {

    /** FR-41, FR-42 — Buyer đánh giá sản phẩm (score 1..5). */
    ReviewResponse create(UUID buyerId, UUID productId, CreateReviewRequest request);

    /** FR-41 — Danh sách đánh giá đang hiển thị (VISIBLE) của một sản phẩm. */
    PageResponse<ReviewResponse> listVisibleByProduct(UUID productId, Pageable pageable);

    /** FR-45 — Admin xem danh sách đánh giá để kiểm duyệt. */
    PageResponse<ReviewResponse> listForAdmin(ReviewStatus status, UUID productId, Pageable pageable);

    /** FR-59 — Admin đặt trạng thái đánh giá: VISIBLE / HIDDEN. */
    ReviewResponse updateStatus(UUID reviewId, UpdateReviewStatusRequest request);
}
