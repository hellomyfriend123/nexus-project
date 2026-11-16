package com.nexus.catalog.repository;

import com.nexus.catalog.entity.ProductReview;
import com.nexus.catalog.enums.ReviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

/**
 * Truy vấn đánh giá sản phẩm (FR-41, FR-42, FR-45, FR-59).
 */
public interface ProductReviewRepository extends JpaRepository<ProductReview, UUID> {

    /** Đánh giá đang hiển thị của một sản phẩm (FR-41). */
    Page<ProductReview> findByProductIdAndStatus(UUID productId, ReviewStatus status, Pageable pageable);

    Page<ProductReview> findByProductId(UUID productId, Pageable pageable);

    /** Danh sách kiểm duyệt theo trạng thái (FR-45). */
    Page<ProductReview> findByStatus(ReviewStatus status, Pageable pageable);

    /** Chặn Buyer đánh giá trùng cho cùng một đơn hàng của cùng một sản phẩm (FR-42). */
    boolean existsByProductIdAndBuyerIdAndOrderId(UUID productId, UUID buyerId, UUID orderId);
}
