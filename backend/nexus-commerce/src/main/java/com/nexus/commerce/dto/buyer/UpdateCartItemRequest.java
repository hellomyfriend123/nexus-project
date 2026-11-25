package com.nexus.commerce.dto.buyer;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * FR-17 — Buyer đổi số lượng của một dòng hàng trong giỏ.
 * Gửi số lượng tuyệt đối (không phải số chênh lệch); service tính lại {@code subtotal} của cart.
 */
public record UpdateCartItemRequest(

        @NotNull(message = "quantity không được để trống")
        @Min(value = 1, message = "quantity phải lớn hơn 0")
        Integer quantity
) {
}
