package com.nexus.fulfillment.dto.common;

import com.nexus.fulfillment.enums.InventoryStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * FR-13 / FR-55 — một dòng tồn kho.
 * {@code productId}, {@code skuCode} lấy từ {@code Sku} cùng module để Seller/Admin nhận diện mặt hàng
 * mà không phải gọi thêm API catalog.
 * Không chứa {@code version} (§6 — response không trả version).
 */
public record InventoryResponse(
        UUID id,
        UUID skuId,
        UUID productId,
        String skuCode,
        String skuName,
        UUID warehouseId,
        Integer totalQuantity,
        Integer availableQuantity,
        InventoryStatus status,
        Instant createdAt,
        Instant updatedAt
) {
}
