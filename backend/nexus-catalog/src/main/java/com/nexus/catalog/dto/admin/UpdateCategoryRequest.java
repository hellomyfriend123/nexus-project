package com.nexus.catalog.dto.admin;

import com.nexus.catalog.enums.CategoryStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Yêu cầu cập nhật danh mục (FR-09, FR-54) — PUT nên là thay thế toàn bộ:
 * {@code name}, {@code description}, {@code parentId}, {@code sortOrder}, {@code status} đều được ghi đè.
 * {@code parentId} null nghĩa là đưa danh mục về cấp gốc.
 */
public record UpdateCategoryRequest(

        @NotBlank(message = "Tên danh mục không được để trống")
        @Size(max = 150, message = "Tên danh mục tối đa 150 ký tự")
        String name,

        @Size(max = 1000, message = "Mô tả danh mục tối đa 1000 ký tự")
        String description,

        UUID parentId,

        @PositiveOrZero(message = "Thứ tự sắp xếp không được là số âm")
        Integer sortOrder,

        @NotNull(message = "Trạng thái danh mục không được để trống")
        CategoryStatus status
) {
}
