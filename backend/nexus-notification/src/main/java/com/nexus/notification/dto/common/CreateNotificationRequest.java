package com.nexus.notification.dto.common;

import com.nexus.notification.enums.NotificationEventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Yêu cầu tạo thông báo (FR-49) — endpoint nội bộ cho các module nghiệp vụ
 * (Order, Auction, Shipment, User…) gọi vào ở giai đoạn business logic.
 *
 * <p>Khác với các DTO khác của hệ thống, {@code userId} ở đây là <b>người nhận</b> thông báo
 * chứ không phải người đang đăng nhập, nên bắt buộc phải truyền trong body (§10 nhóm 5.13).
 * Không dùng DTO này cho thao tác đọc/ghi của chính người dùng.</p>
 */
public record CreateNotificationRequest(

        @NotNull(message = "userId (người nhận thông báo) không được để trống")
        UUID userId,

        @NotNull(message = "eventType không được để trống")
        NotificationEventType eventType,

        @NotBlank(message = "title không được để trống")
        @Size(max = 255, message = "title tối đa 255 ký tự")
        String title,

        @Size(max = 4000, message = "content tối đa 4000 ký tự")
        String content,

        @Size(max = 50, message = "referenceType tối đa 50 ký tự")
        String referenceType,

        UUID referenceId
) {
}
