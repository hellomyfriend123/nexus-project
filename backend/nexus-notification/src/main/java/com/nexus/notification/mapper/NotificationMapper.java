package com.nexus.notification.mapper;

import com.nexus.notification.dto.common.NotificationResponse;
import com.nexus.notification.dto.common.NotificationSummaryResponse;
import com.nexus.notification.entity.Notification;

import java.util.List;

/**
 * Mapper viết tay (không MapStruct, không reflection) — xem §9.
 */
public final class NotificationMapper {

    private NotificationMapper() {
    }

    public static NotificationResponse toResponse(Notification entity) {
        return new NotificationResponse(
                entity.getId(),
                entity.getUserId(),
                entity.getEventType(),
                entity.getTitle(),
                entity.getContent(),
                entity.getReferenceType(),
                entity.getReferenceId(),
                entity.isRead(),
                entity.getReadAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt());
    }

    public static NotificationSummaryResponse toSummary(Notification entity) {
        return new NotificationSummaryResponse(
                entity.getId(),
                entity.getEventType(),
                entity.getTitle(),
                entity.getReferenceType(),
                entity.getReferenceId(),
                entity.isRead(),
                entity.getReadAt(),
                entity.getCreatedAt());
    }

    public static List<NotificationSummaryResponse> toSummaryList(List<Notification> entities) {
        return entities.stream().map(NotificationMapper::toSummary).toList();
    }
}
