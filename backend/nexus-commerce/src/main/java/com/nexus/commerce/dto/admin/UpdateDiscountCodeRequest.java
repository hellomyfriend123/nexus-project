package com.nexus.commerce.dto.admin;

import com.nexus.commerce.enums.DiscountCodeStatus;
import com.nexus.commerce.enums.DiscountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * FR-47/58 — Admin cập nhật mã giảm giá.
 * {@code usedCount} KHÔNG cho sửa qua API (chỉ service tăng khi checkout thành công).
 */
public record UpdateDiscountCodeRequest(

        UUID campaignId,

        @NotBlank(message = "code không được để trống")
        @Size(max = 50, message = "code tối đa 50 ký tự")
        String code,

        @NotNull(message = "discountType không được để trống")
        DiscountType discountType,

        @NotNull(message = "discountValue không được để trống")
        @Positive(message = "discountValue phải lớn hơn 0")
        BigDecimal discountValue,

        @NotNull(message = "minOrderAmount không được để trống")
        @PositiveOrZero(message = "minOrderAmount không được âm")
        BigDecimal minOrderAmount,

        @Positive(message = "usageLimit phải lớn hơn 0")
        Integer usageLimit,

        Instant startAt,

        Instant endAt,

        /** Bỏ trống ⇒ giữ nguyên trạng thái hiện tại. */
        DiscountCodeStatus status
) {
}
