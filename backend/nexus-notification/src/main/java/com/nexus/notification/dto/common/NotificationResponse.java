package com.nexus.notification.dto.common;

import com.nexus.notification.enums.NotificationEventType;

import java.time.Instant;
import java.util.UUID;

/**
 * Thông báo đầy đủ (FR-50) — dùng cho chi tiết và cho response của FR-49/FR-51.
 * Không chứa {@code deletedAt}/{@code version} (module không có hai field này).
 */
public record NotificationResponse(
        UUID id,
        UUID userId,
        NotificationEventType eventType,
        String title,
        String content,
        String referenceType,
        UUID referenceId,
        boolean read,
        Instant readAt,
        Instant createdAt,
        Instant updatedAt
) {
}
