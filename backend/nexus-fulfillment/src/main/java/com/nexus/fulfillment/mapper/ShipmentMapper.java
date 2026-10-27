package com.nexus.fulfillment.mapper;

import com.nexus.fulfillment.dto.common.ShipmentResponse;
import com.nexus.fulfillment.entity.Shipment;

import java.util.List;

/** Mapper viết tay cho {@link Shipment} (§9). */
public final class ShipmentMapper {

    private ShipmentMapper() {
    }

    public static ShipmentResponse toResponse(Shipment entity) {
        return new ShipmentResponse(
                entity.getId(),
                entity.getOrderId(),
                entity.getSellerId(),
                entity.getWarehouseId(),
                entity.getTrackingNumber(),
                entity.getStatus(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    public static List<ShipmentResponse> toResponseList(List<Shipment> entities) {
        return entities.stream().map(ShipmentMapper::toResponse).toList();
    }
}
