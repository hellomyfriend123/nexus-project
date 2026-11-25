package com.nexus.catalog.dto.seller;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Yêu cầu gán/đổi danh mục cho sản phẩm (FR-10).
 */
public record AssignCategoryRequest(

        @NotNull(message = "Danh mục cần gán không được để trống")
        UUID categoryId
) {
}
