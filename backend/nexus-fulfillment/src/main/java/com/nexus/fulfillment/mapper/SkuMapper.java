package com.nexus.fulfillment.mapper;

import com.nexus.fulfillment.dto.common.SkuResponse;
import com.nexus.fulfillment.entity.Sku;

import java.util.List;

/** Mapper viết tay cho {@link Sku} (§9). */
public final class SkuMapper {

    private SkuMapper() {
    }

    public static SkuResponse toResponse(Sku entity) {
        return new SkuResponse(
                entity.getId(),
                entity.getProductId(),
                entity.getSellerId(),
                entity.getSkuCode(),
                entity.getName(),
                entity.getPrice(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public static List<SkuResponse> toResponseList(List<Sku> entities) {
        return entities.stream().map(SkuMapper::toResponse).toList();
    }
}
