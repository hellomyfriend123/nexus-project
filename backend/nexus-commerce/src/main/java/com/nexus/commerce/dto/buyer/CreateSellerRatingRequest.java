package com.nexus.commerce.dto.buyer;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * FR-43 / FR-44 — Buyer đánh giá Seller sau khi đơn hoàn tất.
 *
 * <p>{@code buyerId} KHÔNG có trong request: lấy từ token (§7.5). Service kiểm tra
 * đơn phải thuộc buyer này và ở trạng thái {@code COMPLETED}, nếu không → {@code BusinessException}.</p>
 */
public record CreateSellerRatingRequest(

        @NotNull(message = "orderId không được để trống")
        UUID orderId,

        @NotNull(message = "sellerId không được để trống")
        UUID sellerId,

        @NotNull(message = "score không được để trống")
        @Min(value = 1, message = "score phải từ 1 đến 5")
        @Max(value = 5, message = "score phải từ 1 đến 5")
        Integer score,

        @Size(max = 2000, message = "comment tối đa 2000 ký tự")
        String comment
) {
}
