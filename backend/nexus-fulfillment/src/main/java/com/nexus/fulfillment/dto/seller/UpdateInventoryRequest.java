package com.nexus.fulfillment.dto.seller;

import com.nexus.fulfillment.enums.InventoryOperation;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/**
 * FR-14 — cập nhật tồn kho.
 * <p>
 * Ví dụ: {@code {"operation": "DECREASE", "quantity": 3}}.
 * Sau khi áp dụng, service tự tính lại {@code status} và giữ {@code totalQuantity} nhất quán.
 */
public record UpdateInventoryRequest(

        @NotNull(message = "operation không được để trống (INCREASE | DECREASE | SET_AVAILABLE)")
        InventoryOperation operation,

        @NotNull(message = "quantity không được để trống")
        @PositiveOrZero(message = "quantity phải lớn hơn hoặc bằng 0")
        Integer quantity
) {
}
