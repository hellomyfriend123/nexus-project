package com.nexus.catalog.mapper;

import com.nexus.catalog.dto.common.ReviewResponse;
import com.nexus.catalog.entity.ProductReview;

import java.util.List;

/**
 * Mapper viết tay cho {@link ProductReview} (không dùng MapStruct — §9).
 */
public final class ProductReviewMapper {

    private ProductReviewMapper() {
    }

    public static ReviewResponse toResponse(ProductReview entity) {
        return new ReviewResponse(
                entity.getId(),
                entity.getProductId(),
                entity.getBuyerId(),
                entity.getOrderId(),
                entity.getScore(),
                entity.getComment(),
                entity.getStatus(),
                entity.getCreatedAt());
    }

    public static List<ReviewResponse> toResponseList(List<ProductReview> entities) {
        return entities == null ? List.of() : entities.stream().map(ProductReviewMapper::toResponse).toList();
    }
}
