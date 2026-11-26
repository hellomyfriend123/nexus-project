package com.nexus.fulfillment.dto.seller;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Tạo SKU cho một Product đã có.
 * <p>
 * {@code sellerId} KHÔNG nhận từ client — lấy từ token (SecurityUtils.currentUserId()).
 * <p>
 * <b>KHÔNG nhận {@code skuCode} từ client:</b> mã SKU do hệ thống tự sinh dạng
 * {@code SKU-001}, {@code SKU-002}, … (xem {@code SkuServiceImpl}). Người dùng chỉ nhập thông tin
 * nghiệp vụ; mã hiển thị lại trong {@code SkuResponse.skuCode} để FE đọc ra cho người dùng thấy.
 * <p>
 * {@code initialTotalQuantity}/{@code initialAvailableQuantity}: tồn kho ban đầu, service sẽ tạo
 * luôn một bản ghi {@code Inventory} ở kho ACTIVE mặc định. Để trống = 0.
 * <p>
 * TODO (FR-05, giai đoạn business logic): luồng "Seller tạo Product kèm SKU + tồn kho ban đầu"
 *       của nexus-catalog sẽ gọi thẳng {@code SkuService.create(...)} với payload tương đương
 *       (productId vừa sinh + initial*Quantity), nên endpoint này giữ nguyên chữ ký.
 */
public record CreateSkuRequest(

        @NotNull(message = "productId không được để trống")
        UUID productId,

        @Size(max = 200, message = "Tên SKU tối đa 200 ký tự")
        String name,

        @PositiveOrZero(message = "Giá gốc phải lớn hơn hoặc bằng 0")
        BigDecimal costPrice,

        @PositiveOrZero(message = "Giá SKU phải lớn hơn hoặc bằng 0")
        BigDecimal price,

        @PositiveOrZero(message = "Tồn kho ban đầu phải lớn hơn hoặc bằng 0")
        Integer initialTotalQuantity,

        @PositiveOrZero(message = "Tồn khả dụng ban đầu phải lớn hơn hoặc bằng 0")
        Integer initialAvailableQuantity
) {
    public CreateSkuRequest(
            UUID productId,
            String name,
            BigDecimal price,
            Integer initialTotalQuantity,
            Integer initialAvailableQuantity
    ) {
        this(productId, name, null, price, initialTotalQuantity, initialAvailableQuantity);
    }
}
