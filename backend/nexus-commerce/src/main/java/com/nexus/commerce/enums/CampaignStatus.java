package com.nexus.commerce.enums;

import java.util.Locale;
import java.util.Optional;

/**
 * Trạng thái chiến dịch khuyến mãi (FR-46, §16).
 * Xoá chiến dịch = chuyển sang {@link #ENDED} (không hard delete — §11.6).
 */
public enum CampaignStatus {

    DRAFT,

    ACTIVE,

    ENDED;

    public static Optional<CampaignStatus> parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(valueOf(raw.trim().toUpperCase(Locale.ROOT)));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }
}
