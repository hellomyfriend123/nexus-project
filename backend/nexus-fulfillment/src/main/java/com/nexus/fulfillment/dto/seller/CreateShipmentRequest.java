package com.nexus.fulfillment.dto.seller;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * FR-38 — Seller tạo vận đơn cho một đơn hàng.
 * <p>
 * {@code sellerId} lấy từ token, {@code status} luôn khởi tạo là {@code PENDING}.
 * {@code warehouseId} tuỳ chọn (không truyền thì vận đơn chưa gắn kho xuất).
 * <p>
 * TODO (giai đoạn business logic): điều kiện "Order đã thanh toán thành công" và việc chỉ Seller
 *       sở hữu Order mới được tạo vận đơn sẽ được kiểm tra khi nối với {@code nexus-commerce}
 *       (gọi CommerceService, không join bảng). Hiện tại chỉ validate orderId không null.
 */
public record CreateShipmentRequest(

        @NotNull(message = "orderId không được để trống")
        UUID orderId,

        UUID warehouseId,

        @Size(max = 100, message = "Mã vận đơn tối đa 100 ký tự")
        String trackingNumber
) {
}
