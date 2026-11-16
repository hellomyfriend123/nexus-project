package com.nexus.fulfillment.enums;

/**
 * Trạng thái vận đơn (§16 — bảng {@code shipments}).
 * Luồng hợp lệ duy nhất (FR-39): PENDING → SHIPPED → DELIVERED.
 * Không cho nhảy cóc (PENDING → DELIVERED) và không cho lùi trạng thái.
 */
public enum ShipmentStatus {

    /** Vừa tạo, chưa giao cho đơn vị vận chuyển. */
    PENDING,

    /** Đã gửi đi / đang trên đường. */
    SHIPPED,

    /** Đã giao thành công. */
    DELIVERED;

    /**
     * @return trạng thái kế tiếp hợp lệ, hoặc {@code null} nếu đây là trạng thái cuối.
     */
    public ShipmentStatus nextStatus() {
        return switch (this) {
            case PENDING -> SHIPPED;
            case SHIPPED -> DELIVERED;
            case DELIVERED -> null;
        };
    }
}
