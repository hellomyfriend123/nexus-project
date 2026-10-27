package com.nexus.fulfillment.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Tạo kho hàng (Admin). Trạng thái mới luôn là {@code ACTIVE} — service tự set. */
public record CreateWarehouseRequest(

        @NotBlank(message = "code không được để trống")
        @Size(max = 50, message = "Mã kho tối đa 50 ký tự")
        String code,

        @NotBlank(message = "name không được để trống")
        @Size(max = 150, message = "Tên kho tối đa 150 ký tự")
        String name,

        @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự")
        String address
) {
}
