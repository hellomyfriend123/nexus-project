package com.nexus.catalog.dto.admin;

import com.nexus.catalog.enums.ReviewStatus;
import jakarta.validation.constraints.NotNull;

/**
 * Yêu cầu kiểm duyệt đánh giá (FR-45, FR-59): {@code VISIBLE} hoặc {@code HIDDEN}.
 */
public record UpdateReviewStatusRequest(

        @NotNull(message = "Trạng thái đánh giá không được để trống")
        ReviewStatus status
) {
}
