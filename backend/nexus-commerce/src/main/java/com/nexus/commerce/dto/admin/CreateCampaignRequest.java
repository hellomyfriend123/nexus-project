package com.nexus.commerce.dto.admin;

import com.nexus.commerce.enums.CampaignStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * FR-46 — Admin tạo chiến dịch khuyến mãi.
 * {@code status} tuỳ chọn; bỏ trống ⇒ service đặt {@code DRAFT}.
 */
public record CreateCampaignRequest(

        @NotBlank(message = "name không được để trống")
        @Size(max = 200, message = "name tối đa 200 ký tự")
        String name,

        @Size(max = 2000, message = "description tối đa 2000 ký tự")
        String description,

        LocalDate startDate,

        LocalDate endDate,

        CampaignStatus status
) {
}
