package com.nexus.fulfillment.dto.seller;

import com.nexus.fulfillment.enums.ShipmentStatus;
import jakarta.validation.constraints.NotNull;

/**
 * FR-39 — cập nhật trạng thái vận đơn.
 * Chỉ chấp nhận bước kế tiếp trong chuỗi PENDING → SHIPPED → DELIVERED;
 * nhảy cóc hoặc lùi trạng thái sẽ bị service từ chối bằng {@code BusinessException}.
 */
public record UpdateShipmentStatusRequest(

        @NotNull(message = "status không được để trống (SHIPPED | DELIVERED)")
        ShipmentStatus status
) {
}
