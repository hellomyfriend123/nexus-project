package com.nexus.catalog.enums;

/**
 * Trạng thái sản phẩm (FR-05, FR-53).
 * <ul>
 *   <li>{@code DRAFT} — bản nháp, chưa công khai (Admin có thể chuyển từ ACTIVE về DRAFT khi cần ẩn tạm).</li>
 *   <li>{@code ACTIVE} — đang hiển thị/mua được.</li>
 *   <li>{@code INACTIVE} — ngừng kinh doanh (Admin quản lý ở FR-53).</li>
 * </ul>
 */
public enum ProductStatus {

    DRAFT,
    ACTIVE,
    INACTIVE
}
