package com.nexus.commerce.dto.buyer;

import com.nexus.commerce.enums.OrderType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * FR-20 / FR-48 — Buyer xem trước số tiền được giảm của một mã giảm giá.
 *
 * <p>Endpoint này <b>không</b> tiêu thụ lượt dùng ({@code usedCount} chỉ tăng khi checkout thành công).</p>
 *
 * <p>{@code orderType} mặc định {@code DIRECT}: nếu là {@code AUCTION} thì mã giảm giá
 * KHÔNG được áp dụng (đơn đấu giá dùng giá thắng cuộc).</p>
 */
public record ApplyDiscountRequest(

        @NotBlank(message = "code không được để trống")
        @Size(max = 50, message = "code tối đa 50 ký tự")
        String code,

        @NotNull(message = "orderAmount không được để trống")
        @PositiveOrZero(message = "orderAmount không được âm")
        BigDecimal orderAmount,

        /** Loại đơn đang xét; null ⇒ hiểu là {@code DIRECT}. */
        OrderType orderType
) {
}
