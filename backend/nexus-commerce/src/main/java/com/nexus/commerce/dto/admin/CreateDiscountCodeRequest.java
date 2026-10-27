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
 * FR-47 — Admin tạo mã giảm giá.
 *
 * <p>Ràng buộc {@code discountType} / {@code discountValue} (PERCENTAGE: 0 &lt; value ≤ 100;
 * FIXED_AMOUNT: value &gt; 0) được kiểm tra trong service vì phụ thuộc lẫn nhau —
 * không thể diễn đạt bằng annotation trên từng field.</p>
 *
 * <p>{@code code} sẽ được chuẩn hoá về chữ HOA trước khi lưu; trùng ⇒ {@code DuplicateResourceException}.</p>
 */
public record CreateDiscountCodeRequest(

        /** Chiến dịch chứa mã (tuỳ chọn). */
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

        /** Bỏ trống ⇒ không giới hạn số lượt dùng. */
        @Positive(message = "usageLimit phải lớn hơn 0")
        Integer usageLimit,

        Instant startAt,

        Instant endAt,

        /** Bỏ trống ⇒ {@code ACTIVE}. */
        DiscountCodeStatus status
) {
}
