package com.nexus.fulfillment.dto.seller;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * FR-38 — Seller tạo vận đơn cho một đơn hàng.
 * <p>
 * {@code sellerId} lấy từ token, {@code status} luôn khởi tạo là {@code PENDING}.
 * {@code warehouseId} tuỳ chọn (không truyền thì vận đơn chưa gắn kho xuất).
 * <p>
 * <b>KHÔNG nhận {@code trackingNumber} từ client:</b> mã vận đơn do hệ thống tự sinh dạng
 * {@code TRK-001}, {@code TRK-002}, … (xem {@code ShipmentServiceImpl}). Seller chỉ tạo đơn,
 * mã hiển thị lại trong {@code ShipmentResponse.trackingNumber} để FE đọc ra cho người dùng thấy.
 * <p>
 * TODO (giai đoạn business logic): điều kiện "Order đã thanh toán thành công" và việc chỉ Seller
 *       sở hữu Order mới được tạo vận đơn sẽ được kiểm tra khi nối với {@code nexus-commerce}
 *       (gọi CommerceService, không join bảng). Hiện tại chỉ validate orderId không null.
 */
public record CreateShipmentRequest(

        @NotNull(message = "orderId không được để trống")
        UUID orderId,

        UUID warehouseId
) {
}
