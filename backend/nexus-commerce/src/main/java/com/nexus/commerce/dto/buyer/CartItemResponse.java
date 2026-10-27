package com.nexus.commerce.dto.buyer;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Một dòng hàng trong giỏ (FR-15/16/17/18).
 * {@code lineTotal} được tính tại mapper ({@code unitPrice * quantity}) để client không phải nhân.
 */
public record CartItemResponse(
        UUID id,
        UUID productId,
        UUID skuId,
        UUID sellerId,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal
) {
}
