package com.nexus.commerce.dto.buyer;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Dòng hàng của đơn — snapshot tại thời điểm đặt (FR-22/23).
 * {@code sellerId} là UUID của Seller; module commerce không join sang module khác.
 */
public record OrderItemResponse(
        UUID id,
        UUID productId,
        UUID skuId,
        UUID sellerId,
        String productNameSnapshot,
        String skuCodeSnapshot,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal
) {
}
