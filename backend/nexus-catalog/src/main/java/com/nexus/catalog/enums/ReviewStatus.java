package com.nexus.catalog.enums;

/**
 * Trạng thái kiểm duyệt đánh giá sản phẩm (FR-41, FR-45, FR-59).
 * Buyer tạo đánh giá mới luôn ở trạng thái {@code VISIBLE}; Admin có thể chuyển sang {@code HIDDEN}.
 */
public enum ReviewStatus {

    VISIBLE,
    HIDDEN
}
