package com.nexus.commerce.service;

import com.nexus.commerce.dto.buyer.CheckoutRequest;
import com.nexus.commerce.dto.buyer.OrderResponse;

import java.util.UUID;

/**
 * Checkout — FR-19 (đặt hàng từ giỏ) và FR-22 (sinh đơn hàng).
 */
public interface CheckoutService {

    /**
     * FR-19/FR-22 — biến giỏ {@code ACTIVE} của Buyer thành một đơn hàng.
     *
     * <p>Các bước: lấy giỏ ACTIVE (có ít nhất 1 dòng) → kiểm tra <b>chỉ một Seller</b> (giới hạn MVP)
     * → snapshot dòng hàng → áp mã giảm giá (nếu có) → sinh {@code orderNumber} → lưu Order + OrderItem
     * → chuyển giỏ sang {@code CONVERTED} → tăng {@code usedCount} của mã giảm giá.</p>
     */
    OrderResponse checkout(UUID buyerId, CheckoutRequest request);
}
