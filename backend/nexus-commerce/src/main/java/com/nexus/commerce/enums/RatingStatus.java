package com.nexus.commerce.enums;

/**
 * Trạng thái hiển thị của đánh giá Seller (FR-43/44, §16).
 * Mặc định {@link #VISIBLE}; Admin ẩn bằng {@link #HIDDEN} (FR-58) — không xoá cứng.
 */
public enum RatingStatus {

    VISIBLE,

    HIDDEN
}
