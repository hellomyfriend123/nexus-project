package com.nexus.fulfillment.mapper;

import com.nexus.fulfillment.dto.common.WarehouseResponse;
import com.nexus.fulfillment.entity.Warehouse;

import java.util.List;

/** Mapper viết tay cho {@link Warehouse} (§9). */
public final class WarehouseMapper {

    private WarehouseMapper() {
    }

    public static WarehouseResponse toResponse(Warehouse entity) {
        return new WarehouseResponse(
                entity.getId(),
                entity.getCode(),
                entity.getName(),
                entity.getAddress(),
                entity.getStatus(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public static List<WarehouseResponse> toResponseList(List<Warehouse> entities) {
        return entities.stream().map(WarehouseMapper::toResponse).toList();
    }
}
