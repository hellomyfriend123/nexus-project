package com.nexus.fulfillment.dto.common;

import com.nexus.fulfillment.enums.WarehouseStatus;

import java.time.Instant;
import java.util.UUID;

/** Kho hàng (Admin quản lý; Seller/Buyer chỉ thấy {@code warehouseId}). */
public record WarehouseResponse(
        UUID id,
        String code,
        String name,
        String address,
        WarehouseStatus status,
        Instant createdAt,
        Instant updatedAt
) {
}
