package com.nexus.notification.dto.common;

import com.nexus.notification.enums.NotificationEventType;

import java.time.Instant;
import java.util.UUID;

/**
 * Bản rút gọn của thông báo dùng cho danh sách có phân trang (FR-50):
 * bỏ {@code content} và {@code updatedAt} để payload nhẹ — UI chỉ cần badge + tiêu đề,
 * chi tiết đầy đủ lấy qua {@code GET /notifications/{id}}.
 */
public record NotificationSummaryResponse(
        UUID id,
        NotificationEventType eventType,
        String title,
        String referenceType,
        UUID referenceId,
        boolean read,
        Instant readAt,
        Instant createdAt
) {
}
