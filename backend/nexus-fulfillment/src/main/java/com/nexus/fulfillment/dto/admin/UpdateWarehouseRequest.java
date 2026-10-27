package com.nexus.fulfillment.dto.admin;

import com.nexus.fulfillment.enums.WarehouseStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Cập nhật kho hàng (Admin).
 * "Xoá" kho = gửi {@code status = INACTIVE} (không hard delete).
 */
public record UpdateWarehouseRequest(

        @NotBlank(message = "name không được để trống")
        @Size(max = 150, message = "Tên kho tối đa 150 ký tự")
        String name,

        @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự")
        String address,

        @NotNull(message = "status không được để trống (ACTIVE | INACTIVE)")
        WarehouseStatus status
) {
}
