package com.nexus.notification.service.impl;

import com.nexus.common.api.PageResponse;
import com.nexus.common.exception.ForbiddenOperationException;
import com.nexus.common.exception.ResourceNotFoundException;
import com.nexus.notification.dto.common.CreateNotificationRequest;
import com.nexus.notification.dto.common.NotificationResponse;
import com.nexus.notification.dto.common.NotificationSummaryResponse;
import com.nexus.notification.entity.Notification;
import com.nexus.notification.enums.NotificationEventType;
import com.nexus.notification.repository.NotificationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

/**
 * Test nghiệp vụ thuần Mockito (§14.1) — KHÔNG Spring context, KHÔNG DB.
 *
 * <p>Trọng tâm: bảo vệ quyền sở hữu thông báo (FR-50/FR-51) và tính đúng đắn của
 * bộ đếm chưa đọc.</p>
 */
@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    private static final UUID OWNER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID OTHER_USER_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID NOTIFICATION_ID = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private static final UUID REFERENCE_ID = UUID.fromString("44444444-4444-4444-4444-444444444444");

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    // ------------------------------------------------------------------ FR-51

    @Test
    @DisplayName("FR-51: đánh dấu đã đọc thông báo của người khác -> ForbiddenOperationException")
    void markAsReadOnForeignNotificationIsForbidden() {
        given(notificationRepository.findByIdAndUserId(NOTIFICATION_ID, OWNER_ID)).willReturn(Optional.empty());
        given(notificationRepository.existsById(NOTIFICATION_ID)).willReturn(true);

        assertThatThrownBy(() -> notificationService.markAsRead(OWNER_ID, NOTIFICATION_ID))
                .isInstanceOf(ForbiddenOperationException.class)
                .hasMessageContaining("không thuộc về bạn");

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    @DisplayName("FR-51: thông báo không tồn tại -> ResourceNotFoundException (404)")
    void markAsReadOnMissingNotificationIsNotFound() {
        given(notificationRepository.findByIdAndUserId(NOTIFICATION_ID, OWNER_ID)).willReturn(Optional.empty());
        given(notificationRepository.existsById(NOTIFICATION_ID)).willReturn(false);

        assertThatThrownBy(() -> notificationService.markAsRead(OWNER_ID, NOTIFICATION_ID))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    @DisplayName("FR-51: đánh dấu đã đọc thông báo của chính mình -> set isRead + readAt")
    void markAsReadSetsReadFlagAndTimestamp() {
        Notification notification = unreadNotification(OWNER_ID);
        given(notificationRepository.findByIdAndUserId(NOTIFICATION_ID, OWNER_ID))
                .willReturn(Optional.of(notification));
        given(notificationRepository.save(any(Notification.class))).willAnswer(invocation -> invocation.getArgument(0));

        NotificationResponse response = notificationService.markAsRead(OWNER_ID, NOTIFICATION_ID);

        assertThat(response.read()).isTrue();
        assertThat(response.readAt()).isNotNull();
        assertThat(notification.isRead()).isTrue();
        assertThat(notification.getReadAt()).isNotNull();
    }

    @Test
    @DisplayName("FR-51: gọi lại trên thông báo đã đọc -> giữ nguyên readAt (idempotent)")
    void markAsReadIsIdempotent() {
        Instant firstReadAt = Instant.parse("2026-01-01T10:00:00Z");
        Notification notification = unreadNotification(OWNER_ID);
        notification.setRead(true);
        notification.setReadAt(firstReadAt);
        given(notificationRepository.findByIdAndUserId(NOTIFICATION_ID, OWNER_ID))
                .willReturn(Optional.of(notification));
        given(notificationRepository.save(any(Notification.class))).willAnswer(invocation -> invocation.getArgument(0));

        NotificationResponse response = notificationService.markAsRead(OWNER_ID, NOTIFICATION_ID);

        assertThat(response.readAt()).isEqualTo(firstReadAt);
    }

    @Test
    @DisplayName("FR-51: markAllAsRead chỉ ảnh hưởng thông báo của chính mình (lọc theo userId)")
    void markAllAsReadOnlyAffectsOwnNotifications() {
        given(notificationRepository.markAllAsReadByUserId(eq(OWNER_ID), any(Instant.class))).willReturn(3);

        long updated = notificationService.markAllAsRead(OWNER_ID);

        assertThat(updated).isEqualTo(3);

        ArgumentCaptor<UUID> userIdCaptor = ArgumentCaptor.forClass(UUID.class);
        ArgumentCaptor<Instant> readAtCaptor = ArgumentCaptor.forClass(Instant.class);
        verify(notificationRepository).markAllAsReadByUserId(userIdCaptor.capture(), readAtCaptor.capture());

        assertThat(userIdCaptor.getValue()).isEqualTo(OWNER_ID);
        assertThat(userIdCaptor.getValue()).isNotEqualTo(OTHER_USER_ID);
        assertThat(readAtCaptor.getValue()).isNotNull();
    }

    // ------------------------------------------------------------------ FR-50

    @Test
    @DisplayName("FR-50: unread-count đếm đúng theo userId đang đăng nhập")
    void countUnreadUsesCurrentUserId() {
        given(notificationRepository.countByUserIdAndIsReadFalse(OWNER_ID)).willReturn(7L);

        long unread = notificationService.countUnread(OWNER_ID);

        assertThat(unread).isEqualTo(7L);
        verify(notificationRepository).countByUserIdAndIsReadFalse(OWNER_ID);
    }

    @Test
    @DisplayName("FR-50: danh sách mặc định (unreadOnly=false, không lọc loại) dùng findByUserId + sort createdAt DESC")
    void getMyNotificationsUsesDefaultQueryAndSort() {
        Notification unread = unreadNotification(OWNER_ID);
        Notification read = unreadNotification(OWNER_ID);
        read.setRead(true);

        given(notificationRepository.findByUserId(eq(OWNER_ID), any(Pageable.class)))
                .willReturn(new PageImpl<>(List.of(unread, read), PageRequest.of(0, 20), 2));

        PageResponse<NotificationSummaryResponse> response =
                notificationService.getMyNotifications(OWNER_ID, false, null, PageRequest.of(0, 20));

        assertThat(response.content()).hasSize(2);
        assertThat(response.totalElements()).isEqualTo(2);
        assertThat(response.content().get(0).read()).isFalse();
        assertThat(response.content().get(1).read()).isTrue();

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(notificationRepository).findByUserId(eq(OWNER_ID), pageableCaptor.capture());
        Sort.Order createdAtOrder = pageableCaptor.getValue().getSort().getOrderFor("createdAt");
        assertThat(createdAtOrder).isNotNull();
        assertThat(createdAtOrder.getDirection()).isEqualTo(Sort.Direction.DESC);
    }

    @Test
    @DisplayName("FR-50: unreadOnly=true + eventType -> dùng truy vấn kết hợp cả hai bộ lọc")
    void getMyNotificationsCombinesUnreadAndEventTypeFilters() {
        given(notificationRepository.findByUserIdAndIsReadFalseAndEventType(
                eq(OWNER_ID), eq(NotificationEventType.ORDER_CREATED), any(Pageable.class)))
                .willReturn(new PageImpl<>(List.of(unreadNotification(OWNER_ID))));

        PageResponse<NotificationSummaryResponse> response = notificationService.getMyNotifications(
                OWNER_ID, true, NotificationEventType.ORDER_CREATED, PageRequest.of(0, 20));

        assertThat(response.content()).hasSize(1);
        verify(notificationRepository).findByUserIdAndIsReadFalseAndEventType(
                eq(OWNER_ID), eq(NotificationEventType.ORDER_CREATED), any(Pageable.class));
        verify(notificationRepository, never()).findByUserId(any(UUID.class), any(Pageable.class));
    }

    @Test
    @DisplayName("FR-50: chi tiết thông báo của người khác -> ForbiddenOperationException")
    void getForeignNotificationIsForbidden() {
        given(notificationRepository.findByIdAndUserId(NOTIFICATION_ID, OWNER_ID)).willReturn(Optional.empty());
        given(notificationRepository.existsById(NOTIFICATION_ID)).willReturn(true);

        assertThatThrownBy(() -> notificationService.getMyNotification(OWNER_ID, NOTIFICATION_ID))
                .isInstanceOf(ForbiddenOperationException.class);
    }

    // ------------------------------------------------------------------ FR-49

    @Test
    @DisplayName("FR-49: tạo thông báo -> trạng thái chưa đọc, readAt null, map đủ trường")
    void createNotificationStartsUnread() {
        given(notificationRepository.save(any(Notification.class))).willAnswer(invocation -> {
            Notification entity = invocation.getArgument(0);
            entity.setId(NOTIFICATION_ID);
            entity.setCreatedAt(Instant.parse("2026-02-01T08:00:00Z"));
            return entity;
        });

        NotificationResponse response = notificationService.create(new CreateNotificationRequest(
                OWNER_ID,
                NotificationEventType.ORDER_CREATED,
                "Đơn hàng đã được tạo",
                "Đơn ORD-001 đã được ghi nhận",
                "ORDER",
                REFERENCE_ID));

        assertThat(response.id()).isEqualTo(NOTIFICATION_ID);
        assertThat(response.userId()).isEqualTo(OWNER_ID);
        assertThat(response.eventType()).isEqualTo(NotificationEventType.ORDER_CREATED);
        assertThat(response.title()).isEqualTo("Đơn hàng đã được tạo");
        assertThat(response.referenceType()).isEqualTo("ORDER");
        assertThat(response.referenceId()).isEqualTo(REFERENCE_ID);
        assertThat(response.read()).isFalse();
        assertThat(response.readAt()).isNull();

        ArgumentCaptor<Notification> entityCaptor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(entityCaptor.capture());
        Notification saved = entityCaptor.getValue();
        assertThat(saved.getUserId()).isEqualTo(OWNER_ID);
        assertThat(saved.isRead()).isFalse();
        assertThat(saved.getReadAt()).isNull();
    }

    @Test
    @DisplayName("FR-49: referenceType rỗng được chuẩn hoá thành null")
    void createNotificationNormalizesBlankReferenceType() {
        given(notificationRepository.save(any(Notification.class))).willAnswer(invocation -> invocation.getArgument(0));

        NotificationResponse response = notificationService.create(OWNER_ID, NotificationEventType.SYSTEM_ANNOUNCEMENT,
                "Bảo trì hệ thống", null, "   ", null);

        assertThat(response.referenceType()).isNull();
        assertThat(response.read()).isFalse();
    }

    @Test
    @DisplayName("FR-49: thiếu tiêu đề -> IllegalArgumentException (được map thành 400)")
    void createNotificationRejectsBlankTitle() {
        assertThatThrownBy(() -> notificationService.create(OWNER_ID, NotificationEventType.SYSTEM_ANNOUNCEMENT,
                " ", "nội dung", null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("title");

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    // ------------------------------------------------------------------ helper

    private static Notification unreadNotification(UUID userId) {
        Notification notification = Notification.builder()
                .userId(userId)
                .eventType(NotificationEventType.ORDER_CREATED)
                .title("Đơn hàng đã được tạo")
                .content("Đơn ORD-001 đã được ghi nhận")
                .referenceType("ORDER")
                .referenceId(REFERENCE_ID)
                .isRead(false)
                .build();
        notification.setId(NOTIFICATION_ID);
        notification.setCreatedAt(Instant.parse("2026-01-01T09:00:00Z"));
        return notification;
    }
}
