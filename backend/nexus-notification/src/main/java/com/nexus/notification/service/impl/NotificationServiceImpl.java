package com.nexus.notification.service.impl;

import com.nexus.common.api.PageResponse;
import com.nexus.common.exception.ForbiddenOperationException;
import com.nexus.common.exception.ResourceNotFoundException;
import com.nexus.notification.dto.common.CreateNotificationRequest;
import com.nexus.notification.dto.common.NotificationResponse;
import com.nexus.notification.dto.common.NotificationSummaryResponse;
import com.nexus.notification.entity.Notification;
import com.nexus.notification.enums.NotificationEventType;
import com.nexus.notification.mapper.NotificationMapper;
import com.nexus.notification.repository.NotificationRepository;
import com.nexus.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Cài đặt nghiệp vụ thông báo in-app (FR-49, FR-50, FR-51).
 *
 * <p>Quy tắc xuyên suốt: mọi thao tác đọc/ghi của người dùng cuối đều nhận {@code userId}
 * từ controller (lấy qua {@code SecurityUtils.currentUserId()}) và lọc theo cột đó —
 * không bao giờ tin {@code userId} do client gửi lên.</p>
 */
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    /** Sắp xếp mặc định: thông báo mới nhất trước (FR-50). */
    private static final Sort DEFAULT_SORT = Sort.by(Sort.Direction.DESC, "createdAt");

    private static final int DEFAULT_PAGE_SIZE = 20;
    private static final int MAX_PAGE_SIZE = 100;

    private final NotificationRepository notificationRepository;

    @Override
    @Transactional
    public NotificationResponse create(UUID userId, NotificationEventType eventType, String title, String content,
                                       String referenceType, UUID referenceId) {
        if (userId == null) {
            throw new IllegalArgumentException("userId (người nhận thông báo) không được để trống");
        }
        if (eventType == null) {
            throw new IllegalArgumentException("eventType không được để trống");
        }
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("title không được để trống");
        }

        Notification notification = Notification.builder()
                .userId(userId)
                .eventType(eventType)
                .title(title)
                .content(content)
                .referenceType(normalize(referenceType))
                .referenceId(referenceId)
                // Thông báo luôn sinh ra ở trạng thái CHƯA đọc (FR-49 + FR-50).
                .isRead(false)
                .readAt(null)
                .build();

        return NotificationMapper.toResponse(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public NotificationResponse create(CreateNotificationRequest request) {
        return create(request.userId(), request.eventType(), request.title(), request.content(),
                request.referenceType(), request.referenceId());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NotificationSummaryResponse> getMyNotifications(UUID userId, boolean unreadOnly,
                                                                       NotificationEventType eventType,
                                                                       Pageable pageable) {
        Pageable effectivePageable = withDefaultSort(pageable);
        Page<Notification> page = findPage(userId, unreadOnly, eventType, effectivePageable);
        return PageResponse.from(page, NotificationMapper::toSummary);
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationResponse getMyNotification(UUID userId, UUID notificationId) {
        return NotificationMapper.toResponse(loadOwnedNotification(userId, notificationId));
    }

    @Override
    @Transactional(readOnly = true)
    public long countUnread(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(UUID userId, UUID notificationId) {
        Notification notification = loadOwnedNotification(userId, notificationId);

        // Idempotent: gọi lại trên thông báo đã đọc không ghi đè readAt lần đầu.
        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(Instant.now());
        }
        return NotificationMapper.toResponse(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public long markAllAsRead(UUID userId) {
        // Một câu UPDATE hàng loạt, lọc theo userId -> chỉ ảnh hưởng thông báo của chính người gọi.
        return notificationRepository.markAllAsReadByUserId(userId, Instant.now());
    }

    /**
     * Chọn truy vấn theo bộ lọc của FR-50 (tránh 4 method service trùng lặp và
     * tránh JPQL với tham số nullable).
     */
    private Page<Notification> findPage(UUID userId, boolean unreadOnly, NotificationEventType eventType,
                                        Pageable pageable) {
        if (unreadOnly && eventType != null) {
            return notificationRepository.findByUserIdAndIsReadFalseAndEventType(userId, eventType, pageable);
        }
        if (unreadOnly) {
            return notificationRepository.findByUserIdAndIsReadFalse(userId, pageable);
        }
        if (eventType != null) {
            return notificationRepository.findByUserIdAndEventType(userId, eventType, pageable);
        }
        return notificationRepository.findByUserId(userId, pageable);
    }

    /**
     * Nạp thông báo và kiểm tra quyền sở hữu.
     * <ul>
     *     <li>Không tồn tại → {@link ResourceNotFoundException} (404)</li>
     *     <li>Tồn tại nhưng của người khác → {@link ForbiddenOperationException} (403)</li>
     * </ul>
     */
    private Notification loadOwnedNotification(UUID userId, UUID notificationId) {
        Optional<Notification> owned = notificationRepository.findByIdAndUserId(notificationId, userId);
        if (owned.isPresent()) {
            return owned.get();
        }
        if (notificationRepository.existsById(notificationId)) {
            throw new ForbiddenOperationException("Thông báo này không thuộc về bạn");
        }
        throw new ResourceNotFoundException("Thông báo", notificationId);
    }

    /** Luôn có thứ tự xác định: nếu client không truyền sort thì dùng createdAt DESC. */
    private static Pageable withDefaultSort(Pageable pageable) {
        if (pageable == null) {
            return PageRequest.of(0, DEFAULT_PAGE_SIZE, DEFAULT_SORT);
        }
        int size = Math.min(Math.max(pageable.getPageSize(), 1), MAX_PAGE_SIZE);
        Sort sort = pageable.getSort().isSorted() ? pageable.getSort() : DEFAULT_SORT;
        return PageRequest.of(pageable.getPageNumber(), size, sort);
    }

    /** Chuỗi nhận từ module khác có thể là "" — quy về null để cột không chứa giá trị rỗng. */
    private static String normalize(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }
}
