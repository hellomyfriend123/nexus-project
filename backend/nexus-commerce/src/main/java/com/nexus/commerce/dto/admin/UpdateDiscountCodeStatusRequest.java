package com.nexus.commerce.dto.admin;

import com.nexus.commerce.enums.DiscountCodeStatus;
import jakarta.validation.constraints.NotNull;

/**
 * FR-47/58 — Admin bật/tắt mã giảm giá.
 * "Xoá" mã = {@code INACTIVE} (không hard delete — §11.6).
 */
public record UpdateDiscountCodeStatusRequest(

        @NotNull(message = "status không được để trống")
        DiscountCodeStatus status
) {
}
