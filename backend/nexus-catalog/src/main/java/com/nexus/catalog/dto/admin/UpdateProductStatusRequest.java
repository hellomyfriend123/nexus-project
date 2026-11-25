package com.nexus.catalog.dto.admin;

import com.nexus.catalog.enums.ProductStatus;
import jakarta.validation.constraints.NotNull;

/**
 * Yêu cầu đổi trạng thái sản phẩm (FR-53).
 */
public record UpdateProductStatusRequest(

        @NotNull(message = "Trạng thái sản phẩm không được để trống")
        ProductStatus status
) {
}
