package com.nexus.catalog.entity;

import com.nexus.catalog.enums.ReviewStatus;
import com.nexus.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * Đánh giá sản phẩm của Buyer (FR-41, FR-42, FR-45, FR-59) — bảng {@code nexus_catalog.product_reviews}.
 * {@code buyerId} và {@code orderId} là tham chiếu chéo module (UUID trần, không quan hệ JPA).
 */
@Entity
@Table(name = "product_reviews", schema = "nexus_catalog")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductReview extends BaseEntity {

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "buyer_id", nullable = false)
    private UUID buyerId;

    /** Đơn hàng làm căn cứ đánh giá (có thể null nếu chưa gắn với đơn hàng cụ thể). */
    @Column(name = "order_id")
    private UUID orderId;

    /** Điểm đánh giá 1..5 (FR-41). */
    @Column(name = "score", nullable = false)
    private Integer score;

    @Column(name = "comment", length = 2000)
    private String comment;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ReviewStatus status;
}
