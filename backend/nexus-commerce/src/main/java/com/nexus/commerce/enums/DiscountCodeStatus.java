package com.nexus.commerce.enums;

import java.util.Locale;
import java.util.Optional;

/**
 * Trạng thái mã giảm giá (FR-47, §16).
 * "Xoá" mã giảm giá = chuyển sang {@link #INACTIVE} (không hard delete — §11.6).
 */
public enum DiscountCodeStatus {

    ACTIVE,

    INACTIVE;

    public static Optional<DiscountCodeStatus> parse(String raw) {
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
