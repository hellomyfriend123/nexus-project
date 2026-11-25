package com.nexus.commerce.dto.seller;

import com.nexus.commerce.enums.OrderStatus;
import jakarta.validation.constraints.NotNull;

/**
 * FR-24 — Seller cập nhật trạng thái đơn theo chuỗi {@code PENDING → CONFIRMED → SHIPPING → COMPLETED}
 * (hoặc sang {@code CANCELLED}).
 *
 * <p>Chỉ nhận đúng trạng thái đích; service chặn nhảy cóc và chặn lùi bằng
 * {@code OrderStatus#canTransitionTo}.</p>
 */
public record UpdateOrderStatusRequest(

        @NotNull(message = "status không được để trống")
        OrderStatus status
) {
}
