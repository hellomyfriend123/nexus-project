package com.nexus.commerce.dto.admin;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Chiến dịch khuyến mãi trả cho Admin (FR-46/58).
 */
public record CampaignResponse(
        UUID id,
        String name,
        String description,
        LocalDate startDate,
        LocalDate endDate,
        String status,
        Instant createdAt,
        Instant updatedAt
) {
}
