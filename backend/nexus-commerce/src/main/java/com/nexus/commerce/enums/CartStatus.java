package com.nexus.commerce.enums;

/**
 * Trạng thái giỏ hàng — FR-15 (§16).
 * Mỗi Buyer chỉ có tối đa MỘT cart ở trạng thái {@link #ACTIVE}
 * (ràng buộc bằng unique partial index {@code ux_carts_buyer_active} trong {@code db/04-commerce.sql}).
 */
public enum CartStatus {

    /** Giỏ đang dùng để thêm/sửa/xoá item. */
    ACTIVE,

    /** Đã checkout thành công — không dùng lại nữa. */
    CONVERTED,

    /** Giỏ bị bỏ quên (chưa triển khai job dọn ở giai đoạn CRUD). */
    ABANDONED
}
