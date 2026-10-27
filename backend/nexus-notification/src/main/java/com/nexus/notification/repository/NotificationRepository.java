package com.nexus.notification.repository;

import com.nexus.notification.entity.Notification;
import com.nexus.notification.enums.NotificationEventType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Truy cập bảng {@code nexus_notification.notifications}.
 *
 * <p>Mọi truy vấn đọc/ghi của người dùng đều lọc theo {@code userId} để không bao giờ
 * lộ hoặc sửa thông báo của người khác (FR-50, FR-51).</p>
 *
 * <p>Thông báo không có soft delete (không có cột {@code deleted_at}) nên không cần
 * điều kiện {@code deletedAt IS NULL}; nghiệp vụ chỉ chuyển {@code is_read} false → true.</p>
 */
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    /** Toàn bộ thông báo của một người dùng (FR-50, không lọc). */
    Page<Notification> findByUserId(UUID userId, Pageable pageable);

    /** Chỉ thông báo chưa đọc của một người dùng (FR-50, {@code unreadOnly=true}). */
    Page<Notification> findByUserIdAndIsReadFalse(UUID userId, Pageable pageable);

    /** Lọc thêm theo loại sự kiện (FR-50, {@code eventType=...}). */
    Page<Notification> findByUserIdAndEventType(UUID userId, NotificationEventType eventType, Pageable pageable);

    /** Kết hợp cả hai bộ lọc của FR-50. */
    Page<Notification> findByUserIdAndIsReadFalseAndEventType(UUID userId, NotificationEventType eventType,
                                                              Pageable pageable);

    /**
     * Lấy thông báo theo id <b>và</b> chủ sở hữu. Trả {@link Optional#empty()} khi thông báo
     * không tồn tại hoặc thuộc người khác — tầng service phân biệt hai trường hợp này.
     */
    Optional<Notification> findByIdAndUserId(UUID id, UUID userId);

    /** Đếm thông báo chưa đọc của người dùng (badge UI, FR-50). */
    long countByUserIdAndIsReadFalse(UUID userId);

    /**
     * Đánh dấu TẤT CẢ thông báo chưa đọc của một người dùng là đã đọc trong MỘT câu UPDATE
     * (FR-51) — tránh N+1 và tránh tải toàn bộ bản ghi lên bộ nhớ.
     *
     * <p>Điều kiện {@code n.userId = :userId} là <b>bắt buộc</b>: người dùng chỉ được ảnh hưởng
     * tới thông báo của chính mình. Dùng JPQL (không native query) nên vẫn chạy được trên mọi
     * dialect. {@code clearAutomatically = true} để persistence context không giữ lại
     * entity đã cũ sau bulk update.</p>
     *
     * @return số bản ghi đã cập nhật
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Notification n
               SET n.isRead = true, n.readAt = :readAt
             WHERE n.userId = :userId
               AND n.isRead = false
            """)
    int markAllAsReadByUserId(@Param("userId") UUID userId, @Param("readAt") Instant readAt);
}
