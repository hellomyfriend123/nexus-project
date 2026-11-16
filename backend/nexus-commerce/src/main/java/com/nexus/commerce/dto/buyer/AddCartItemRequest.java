package com.nexus.commerce.dto.buyer;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * FR-16 — Buyer thêm một dòng hàng vào giỏ.
 *
 * <p><b>TODO (business logic):</b> giá và tên sản phẩm phải lấy từ Catalog; kiểm tra tồn kho phải gọi
 * Fulfillment. Hiện nhận từ request để phục vụ giai đoạn CRUD (module commerce chưa có dependency
 * Maven sang nexus-catalog/nexus-fulfillment).</p>
 */
public record AddCartItemRequest(

        @NotNull(message = "productId không được để trống")
        UUID productId,

        /** SKU cụ thể; có thể bỏ trống nếu sản phẩm chưa phân loại. */
        UUID skuId,

        @NotNull(message = "sellerId không được để trống")
        UUID sellerId,

        @Size(max = 255, message = "productName tối đa 255 ký tự")
        String productName,

        @NotNull(message = "quantity không được để trống")
        @Min(value = 1, message = "quantity phải lớn hơn 0")
        Integer quantity,

        @NotNull(message = "unitPrice không được để trống")
        @Positive(message = "unitPrice phải lớn hơn 0")
        BigDecimal unitPrice
) {
}
