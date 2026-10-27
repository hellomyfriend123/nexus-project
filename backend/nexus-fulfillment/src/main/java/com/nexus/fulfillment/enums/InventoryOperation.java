package com.nexus.fulfillment.enums;

/**
 * Phép cập nhật tồn kho của FR-14 ({@code PATCH /api/v1/seller/fulfillment/inventories/{id}}).
 * Đây là enum của module (không nằm trong §16 vì §16 chỉ liệt kê enum của cột entity),
 * dùng để whitelist phép toán thay vì nhận chuỗi tự do từ client.
 */
public enum InventoryOperation {

    /** Cộng thêm {@code quantity} vào cả tồn tổng và tồn khả dụng (nhập hàng). */
    INCREASE,

    /** Trừ bớt {@code quantity} ở cả tồn tổng và tồn khả dụng (xuất hàng/hủy). */
    DECREASE,

    /** Đặt lại tồn khả dụng = {@code quantity} (kiểm kê thực tế). */
    SET_AVAILABLE
}
