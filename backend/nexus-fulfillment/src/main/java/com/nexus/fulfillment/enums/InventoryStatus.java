package com.nexus.fulfillment.enums;

/**
 * Trạng thái tồn kho (§16 — bảng {@code inventories}), tự tính lại sau mỗi lần cập nhật (FR-14):
 * <ul>
 *     <li>{@code availableQuantity == 0} → {@link #OUT_OF_STOCK}</li>
 *     <li>{@code 0 &lt; availableQuantity &lt;= 5} → {@link #LOW_STOCK}</li>
 *     <li>còn lại → {@link #IN_STOCK}</li>
 * </ul>
 */
public enum InventoryStatus {

    /** Còn hàng. */
    IN_STOCK,

    /** Sắp hết hàng (ngưỡng cảnh báo 5 đơn vị). */
    LOW_STOCK,

    /** Hết hàng. */
    OUT_OF_STOCK
}
