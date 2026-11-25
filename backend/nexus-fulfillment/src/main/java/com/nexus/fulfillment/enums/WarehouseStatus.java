package com.nexus.fulfillment.enums;

/**
 * Trạng thái kho hàng (§16 — bảng {@code warehouses}).
 * Kho không bị xoá cứng: "xoá" = chuyển sang {@link #INACTIVE}.
 */
public enum WarehouseStatus {

    /** Kho đang hoạt động, được phép nhận tồn kho và tạo vận đơn. */
    ACTIVE,

    /** Kho ngừng hoạt động (đã "xoá mềm"). */
    INACTIVE
}
