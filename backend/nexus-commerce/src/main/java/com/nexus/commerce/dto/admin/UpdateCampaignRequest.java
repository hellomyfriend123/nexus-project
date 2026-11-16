package com.nexus.commerce.dto.admin;

import com.nexus.commerce.enums.CampaignStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * FR-46/58 — Admin cập nhật chiến dịch khuyến mãi.
 * Đổi trạng thái sang {@code ENDED} là cách "xoá" chiến dịch (không hard delete — §11.6).
 */
public record UpdateCampaignRequest(

        @NotBlank(message = "name không được để trống")
        @Size(max = 200, message = "name tối đa 200 ký tự")
        String name,

        @Size(max = 2000, message = "description tối đa 2000 ký tự")
        String description,

        LocalDate startDate,

        LocalDate endDate,

        /** Bỏ trống ⇒ giữ nguyên trạng thái hiện tại. */
        CampaignStatus status
) {
}
