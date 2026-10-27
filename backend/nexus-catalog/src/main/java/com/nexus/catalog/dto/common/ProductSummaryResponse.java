package com.nexus.catalog.dto.common;

import com.nexus.catalog.enums.ProductStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Bản rút gọn của sản phẩm dùng cho mọi endpoint danh sách
 * (FR-06, FR-11, FR-12, FR-53). Chỉ chứa dữ liệu đủ để hiển thị danh sách.
 */
public record ProductSummaryResponse(
        UUID id,
        String name,
        BigDecimal basePrice,
        ProductStatus status,
        UUID sellerId,
        UUID categoryId,
        String categoryName,
        String primaryImageUrl,
        Instant createdAt
) {
}
