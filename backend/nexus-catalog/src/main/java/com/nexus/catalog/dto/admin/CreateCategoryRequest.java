package com.nexus.catalog.dto.admin;

import com.nexus.catalog.enums.CategoryStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Yêu cầu tạo danh mục (FR-09, FR-54).
 * {@code status} bỏ trống sẽ mặc định là {@code ACTIVE}.
 */
public record CreateCategoryRequest(

        @NotBlank(message = "Tên danh mục không được để trống")
        @Size(max = 150, message = "Tên danh mục tối đa 150 ký tự")
        String name,

        @Size(max = 1000, message = "Mô tả danh mục tối đa 1000 ký tự")
        String description,

        /** Danh mục cha; bỏ trống nghĩa là tạo danh mục gốc. */
        UUID parentId,

        @PositiveOrZero(message = "Thứ tự sắp xếp không được là số âm")
        Integer sortOrder,

        CategoryStatus status
) {
}
