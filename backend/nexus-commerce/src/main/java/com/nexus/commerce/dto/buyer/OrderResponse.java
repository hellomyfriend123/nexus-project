package com.nexus.commerce.dto.buyer;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Đơn hàng đầy đủ (FR-19/22/23/24/25/56) — trả cho Buyer, Seller và Admin (cùng một cấu trúc,
 * quyền truy cập đã được lọc ở service theo chủ sở hữu).
 */
public record OrderResponse(
        UUID id,
        String orderNumber,
        UUID buyerId,
        UUID sellerId,
        String orderType,
        String status,
        BigDecimal subtotal,
        BigDecimal discount,
        BigDecimal shippingFee,
        BigDecimal totalAmount,
        String shippingAddress,
        String receiverName,
        String receiverPhone,
        String discountCode,
        List<OrderItemResponse> items,
        Instant createdAt,
        Instant updatedAt
) {
}
