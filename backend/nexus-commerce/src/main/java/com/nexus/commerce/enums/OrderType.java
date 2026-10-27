package com.nexus.commerce.enums;

/**
 * Loại đơn hàng (§16). Giai đoạn CRUD của module commerce chỉ sinh ra {@link #DIRECT};
 * {@link #AUCTION} do module {@code nexus-auction} sinh ở giai đoạn business logic (FR-36).
 */
public enum OrderType {

    /** Mua trực tiếp từ giỏ hàng (FR-19/FR-22). */
    DIRECT,

    /** Đơn sinh từ thắng đấu giá (FR-36 — chưa triển khai trong giai đoạn CRUD). */
    AUCTION
}
