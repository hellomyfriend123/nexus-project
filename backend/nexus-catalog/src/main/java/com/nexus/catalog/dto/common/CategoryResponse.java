package com.nexus.catalog.dto.common;

import com.nexus.catalog.enums.CategoryStatus;

import java.util.List;
import java.util.UUID;

/**
 * Danh mục sản phẩm (FR-09, FR-54).
 * Khi trả về dạng cây, {@code children} chứa các danh mục con; khi trả về dạng phẳng
 * (danh sách quản trị), {@code children} là danh sách rỗng.
 */
public record CategoryResponse(
        UUID id,
        String name,
        String description,
        UUID parentId,
        CategoryStatus status,
        Integer sortOrder,
        List<CategoryResponse> children
) {
}
