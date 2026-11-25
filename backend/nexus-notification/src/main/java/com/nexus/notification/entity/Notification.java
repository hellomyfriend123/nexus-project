package com.nexus.notification.entity;

import com.nexus.common.entity.BaseEntity;
import com.nexus.notification.enums.NotificationEventType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.util.UUID;

/**
 * Thông báo in-app của một người dùng (FR-49, FR-50, FR-51) — bảng
 * {@code nexus_notification.notifications}.
 *
 * <p>Theo §11 (baseline 5.13 chỉ yêu cầu in-app), entity <b>KHÔNG</b> có cột {@code channel}
 * (EMAIL/PUSH). Trạng thái đã đọc biểu diễn bằng cặp {@code is_read} + {@code read_at}.</p>
 *
 * <p>{@code userId} là tham chiếu chéo module dạng UUID trần — KHÔNG có quan hệ JPA sang
 * {@code nexus-user}. {@code referenceType}/{@code referenceId} trỏ tới bản ghi nguồn
 * (đơn hàng, phiên đấu giá, vận đơn…) cũng chỉ là dữ liệu thô, không join bảng.</p>
 *
 * <p>Thông báo <b>không</b> bị xoá cứng và cũng không có cột {@code deleted_at};
 * nghiệp vụ chỉ chuyển trạng thái chưa đọc → đã đọc.</p>
 */
@Entity
@Table(name = "notifications", schema = "nexus_notification")
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Notification extends BaseEntity {

    /** Người nhận thông báo (UUID của {@code nexus_user.users}). */
    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    /** Loại sự kiện sinh ra thông báo — 23 giá trị theo FR-49. */
    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 40)
    private NotificationEventType eventType;

    /** Tiêu đề ngắn hiển thị trên badge/danh sách. */
    @Column(name = "title", nullable = false, length = 255)
    private String title;

    /** Nội dung chi tiết (có thể null với thông báo chỉ cần tiêu đề). */
    @Column(name = "content", columnDefinition = "text")
    private String content;

    /** Tên loại bản ghi nguồn, ví dụ {@code ORDER}, {@code AUCTION}, {@code SHIPMENT}. */
    @Column(name = "reference_type", length = 50)
    private String referenceType;

    /** Id bản ghi nguồn (UUID trần, tham chiếu chéo module). */
    @Column(name = "reference_id")
    private UUID referenceId;

    /** Đã đọc hay chưa — mặc định false khi tạo mới (FR-50). */
    @Builder.Default
    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    /** Thời điểm đánh dấu đã đọc (FR-51); null khi còn chưa đọc. */
    @Column(name = "read_at")
    private Instant readAt;
}
