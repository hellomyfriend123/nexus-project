package com.nexus.catalog.dto.buyer;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Yêu cầu Buyer đánh giá sản phẩm (FR-41, FR-42).
 * KHÔNG có field {@code buyerId} — Buyer lấy từ token.
 */
public record CreateReviewRequest(

        @NotNull(message = "Điểm đánh giá không được để trống")
        @Min(value = 1, message = "Điểm đánh giá thấp nhất là 1")
        @Max(value = 5, message = "Điểm đánh giá cao nhất là 5")
        Integer score,

        @Size(max = 2000, message = "Nội dung đánh giá tối đa 2000 ký tự")
        String comment,

        /** Đơn hàng làm căn cứ đánh giá (FR-42) — có thể bỏ trống. */
        UUID orderId
) {
}
