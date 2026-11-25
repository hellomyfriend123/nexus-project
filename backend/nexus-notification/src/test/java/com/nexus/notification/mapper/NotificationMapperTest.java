package com.nexus.notification.mapper;

import com.nexus.notification.dto.common.NotificationResponse;
import com.nexus.notification.dto.common.NotificationSummaryResponse;
import com.nexus.notification.entity.Notification;
import com.nexus.notification.enums.NotificationEventType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Test mapper thuần JUnit (§14.2) — không Mockito, không Spring.
 */
class NotificationMapperTest {

    private static final UUID NOTIFICATION_ID = UUID.fromString("55555555-5555-5555-5555-555555555555");
    private static final UUID USER_ID = UUID.fromString("66666666-6666-6666-6666-666666666666");
    private static final UUID REFERENCE_ID = UUID.fromString("77777777-7777-7777-7777-777777777777");
    private static final Instant CREATED_AT = Instant.parse("2026-03-01T07:30:00Z");
    private static final Instant READ_AT = Instant.parse("2026-03-01T08:00:00Z");

    @Test
    @DisplayName("toResponse map đầy đủ mọi trường, giữ nguyên trạng thái đã đọc")
    void toResponseMapsAllFields() {
        NotificationResponse response = NotificationMapper.toResponse(sample(true));

        assertThat(response.id()).isEqualTo(NOTIFICATION_ID);
        assertThat(response.userId()).isEqualTo(USER_ID);
        assertThat(response.eventType()).isEqualTo(NotificationEventType.SHIPMENT_DELIVERED);
        assertThat(response.title()).isEqualTo("Đơn hàng đã giao");
        assertThat(response.content()).isEqualTo("Đơn ORD-002 đã được giao thành công");
        assertThat(response.referenceType()).isEqualTo("SHIPMENT");
        assertThat(response.referenceId()).isEqualTo(REFERENCE_ID);
        assertThat(response.read()).isTrue();
        assertThat(response.readAt()).isEqualTo(READ_AT);
        assertThat(response.createdAt()).isEqualTo(CREATED_AT);
    }

    @Test
    @DisplayName("toSummary bỏ content/updatedAt nhưng giữ thông tin cần cho badge")
    void toSummaryDropsHeavyFields() {
        NotificationSummaryResponse summary = NotificationMapper.toSummary(sample(false));

        assertThat(summary.id()).isEqualTo(NOTIFICATION_ID);
        assertThat(summary.eventType()).isEqualTo(NotificationEventType.SHIPMENT_DELIVERED);
        assertThat(summary.title()).isEqualTo("Đơn hàng đã giao");
        assertThat(summary.referenceType()).isEqualTo("SHIPMENT");
        assertThat(summary.referenceId()).isEqualTo(REFERENCE_ID);
        assertThat(summary.read()).isFalse();
        assertThat(summary.createdAt()).isEqualTo(CREATED_AT);
    }

    @Test
    @DisplayName("toSummaryList map giữ nguyên thứ tự phần tử")
    void toSummaryListKeepsOrder() {
        Notification first = sample(false);
        Notification second = sample(false);
        second.setTitle("Thông báo thứ hai");

        List<NotificationSummaryResponse> summaries = NotificationMapper.toSummaryList(List.of(first, second));

        assertThat(summaries).hasSize(2);
        assertThat(summaries.get(0).title()).isEqualTo("Đơn hàng đã giao");
        assertThat(summaries.get(1).title()).isEqualTo("Thông báo thứ hai");
    }

    private static Notification sample(boolean read) {
        Notification notification = Notification.builder()
                .userId(USER_ID)
                .eventType(NotificationEventType.SHIPMENT_DELIVERED)
                .title("Đơn hàng đã giao")
                .content("Đơn ORD-002 đã được giao thành công")
                .referenceType("SHIPMENT")
                .referenceId(REFERENCE_ID)
                .isRead(read)
                .readAt(read ? READ_AT : null)
                .build();
        notification.setId(NOTIFICATION_ID);
        notification.setCreatedAt(CREATED_AT);
        notification.setUpdatedAt(CREATED_AT);
        return notification;
    }
}
