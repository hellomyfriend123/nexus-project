package com.nexus.catalog.dto.common;

import com.nexus.catalog.enums.ProductStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Chi tiết sản phẩm (FR-06) — trả về kèm ảnh, danh mục và seller.
 * <p>
 * Lưu ý: {@code sellerId} là UUID tham chiếu chéo module. Thông tin hồ sơ Seller (tên/email)
 * chưa có ở giai đoạn này vì {@code nexus-catalog} KHÔNG được phụ thuộc {@code nexus-user} (§2);
 * sẽ bổ sung bằng lời gọi service sang module user ở giai đoạn business logic.
 */
public record ProductResponse(
        UUID id,
        String name,
        String description,
        BigDecimal basePrice,
        ProductStatus status,
        UUID sellerId,
        UUID categoryId,
        String categoryName,
        String primaryImageUrl,
        List<String> images,
        Instant createdAt,
        Instant updatedAt
) {
}
