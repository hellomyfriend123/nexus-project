package com.nexus.commerce.mapper;

import com.nexus.commerce.dto.buyer.SellerRatingResponse;
import com.nexus.commerce.entity.SellerRating;

import java.util.List;

/**
 * Mapper viết tay cho đánh giá Seller (§9, FR-43/44).
 */
public final class SellerRatingMapper {

    private SellerRatingMapper() {
    }

    public static SellerRatingResponse toResponse(SellerRating entity) {
        return new SellerRatingResponse(
                entity.getId(),
                entity.getOrderId(),
                entity.getSellerId(),
                entity.getBuyerId(),
                entity.getScore(),
                entity.getComment(),
                entity.getStatus() == null ? null : entity.getStatus().name(),
                entity.getCreatedAt()
        );
    }

    public static List<SellerRatingResponse> toResponseList(List<SellerRating> entities) {
        return entities.stream().map(SellerRatingMapper::toResponse).toList();
    }
}
