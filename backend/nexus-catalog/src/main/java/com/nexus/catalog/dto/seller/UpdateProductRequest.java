package com.nexus.catalog.dto.seller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

/**
 * Yêu cầu cập nhật sản phẩm (FR-07) — PUT nên là thay thế toàn bộ:
 * {@code name}, {@code description}, {@code basePrice} và danh sách ảnh đều được ghi đè.
 * Danh sách {@code images} rỗng nghĩa là xoá hết ảnh của sản phẩm.
 */
public record UpdateProductRequest(

        @NotBlank(message = "Tên sản phẩm không được để trống")
        @Size(max = 200, message = "Tên sản phẩm tối đa 200 ký tự")
        String name,

        @Size(max = 5000, message = "Mô tả sản phẩm tối đa 5000 ký tự")
        String description,

        @NotNull(message = "Giá cơ bản không được để trống")
        @Positive(message = "Giá cơ bản phải lớn hơn 0")
        @Digits(integer = 17, fraction = 2, message = "Giá cơ bản tối đa 17 chữ số phần nguyên và 2 chữ số thập phân")
        BigDecimal basePrice,

        @NotNull(message = "Danh sách ảnh không được để trống")
        @Size(max = 10, message = "Mỗi sản phẩm tối đa 10 ảnh")
        List<@Valid ProductImageRequest> images
) {
}
