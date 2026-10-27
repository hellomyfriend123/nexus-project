package com.nexus.notification.service;

import com.nexus.common.api.PageResponse;
import com.nexus.notification.dto.common.CreateNotificationRequest;
import com.nexus.notification.dto.common.NotificationResponse;
import com.nexus.notification.dto.common.NotificationSummaryResponse;
import com.nexus.notification.enums.NotificationEventType;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Nghiệp vụ thông báo in-app (FR-49, FR-50, FR-51).
 */
public interface NotificationService {

    /**
     * <b>ĐIỂM VÀO CHO CÁC MODULE KHÁC</b> (Order, Auction, Shipment, User…).
     *
     * <p>Giai đoạn CRUD chưa có module nào gọi vào; khi làm business logic, các module chỉ cần
     * inject {@code NotificationService} (interface này nằm trong {@code nexus-notification},
     * là phụ thuộc hợp lệ theo §2) rồi gọi method này — <b>không</b> gọi repository và
     * <b>không</b> tự tạo entity thông báo.</p>
     *
     * <p>Ví dụ: {@code nexus-commerce} sau khi tạo đơn gọi
     * {@code notificationService.create(buyerId, NotificationEventType.ORDER_CREATED,
     * "Đơn hàng đã được tạo", "Mã đơn " + orderNumber, "ORDER", orderId)}.</p>
     *
     * <p>Method này là API nội bộ (server-to-server), KHÔNG kiểm tra quyền sở hữu: quyền của
     * người dùng cuối được kiểm ở các method đọc/ghi bên dưới.</p>
     *
     * @param userId        người nhận thông báo (UUID trần, không join sang {@code nexus-user})
     * @param eventType     loại sự kiện, 1 trong 23 giá trị FR-49
     * @param title         tiêu đề, không được null/rỗng
     * @param content       nội dung chi tiết, có thể null
     * @param referenceType tên loại bản ghi nguồn (ví dụ {@code ORDER}), có thể null
     * @param referenceId   id bản ghi nguồn, có thể null
     * @return thông báo vừa tạo (trạng thái chưa đọc)
     */
    NotificationResponse create(UUID userId, NotificationEventType eventType, String title, String content,
                                String referenceType, UUID referenceId);

    /** FR-49 qua HTTP: map {@link CreateNotificationRequest} rồi gọi {@link #create}. */
    NotificationResponse create(CreateNotificationRequest request);

    /**
     * FR-50 — danh sách thông báo của chính người đang đăng nhập, mới nhất trước.
     *
     * @param unreadOnly chỉ lấy thông báo chưa đọc (mặc định false ở controller)
     * @param eventType  lọc theo loại sự kiện, null = tất cả
     */
    PageResponse<NotificationSummaryResponse> getMyNotifications(UUID userId, boolean unreadOnly,
                                                                 NotificationEventType eventType,
                                                                 Pageable pageable);

    /** FR-50 — chi tiết một thông báo; không phải của mình → {@code ForbiddenOperationException}. */
    NotificationResponse getMyNotification(UUID userId, UUID notificationId);

    /** FR-50 — số thông báo chưa đọc của người dùng (badge UI). */
    long countUnread(UUID userId);

    /** FR-51 — đánh dấu một thông báo đã đọc, set {@code readAt}. */
    NotificationResponse markAsRead(UUID userId, UUID notificationId);

    /**
     * FR-51 — đánh dấu tất cả thông báo của chính người dùng là đã đọc bằng một câu UPDATE hàng loạt.
     *
     * @return số bản ghi đã cập nhật
     */
    long markAllAsRead(UUID userId);
}
