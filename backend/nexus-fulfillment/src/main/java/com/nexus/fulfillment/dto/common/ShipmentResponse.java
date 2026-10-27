package com.nexus.fulfillment.dto.common;

import com.nexus.fulfillment.enums.ShipmentStatus;

import java.time.Instant;
import java.util.UUID;

/** FR-38 / FR-39 / FR-40 — vận đơn. */
public record ShipmentResponse(
        UUID id,
        UUID orderId,
        UUID sellerId,
        UUID warehouseId,
        String trackingNumber,
        ShipmentStatus status,
        Instant createdAt,
        Instant updatedAt
) {
}
