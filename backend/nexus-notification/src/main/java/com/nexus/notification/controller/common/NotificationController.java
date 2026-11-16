package com.nexus.notification.controller.common;

import com.nexus.common.api.PageResponse;
import com.nexus.common.security.SecurityUtils;
import com.nexus.notification.dto.common.CreateNotificationRequest;
import com.nexus.notification.dto.common.MarkAllReadResponse;
import com.nexus.notification.dto.common.NotificationResponse;
import com.nexus.notification.dto.common.NotificationSummaryResponse;
import com.nexus.notification.enums.NotificationEventType;
import com.nexus.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Endpoint thông báo in-app — nhóm 5.13 (§10): FR-49 tạo, FR-50 xem, FR-51 đánh dấu đã đọc.
 *
 * <p>Đặt ở {@code controller/common} vì cả ba role (Buyer, Seller, Administrator) dùng chung,
 * bảo vệ bằng {@code @PreAuthorize("isAuthenticated()")}.</p>
 *
 * <p>Không method nào nhận {@code userId} từ request: danh tính lấy từ token qua
 * {@link SecurityUtils#currentUserId()}. Riêng FR-49 là endpoint <b>nội bộ</b> nên
 * {@code userId} trong body là <b>người nhận</b> thông báo, do module gọi vào quyết định.</p>
 */
@RestController
@RequestMapping("/api/v1/notification/notifications")
@Tag(name = "Notification", description = "FR-49, FR-50, FR-51 — thông báo in-app")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * FR-49 — tạo thông báo. Endpoint nội bộ để các module nghiệp vụ (Order, Auction, Shipment,
     * User…) gọi ở giai đoạn business logic; người gọi phải đã xác thực.
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "FR-49 — Tạo thông báo (endpoint nội bộ cho module khác gọi)")
    @ApiResponse(responseCode = "201", description = "Tạo thông báo thành công")
    @ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ", content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE))
    @ApiResponse(responseCode = "401", description = "Chưa xác thực", content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE))
    public ResponseEntity<NotificationResponse> create(@Valid @RequestBody CreateNotificationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(notificationService.create(request));
    }

    /** FR-50 — danh sách thông báo của chính người đang đăng nhập, mới nhất trước. */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "FR-50 — Xem danh sách thông báo của tôi (lọc chưa đọc / theo loại sự kiện)")
    @ApiResponse(responseCode = "200", description = "Lấy danh sách thành công")
    @ApiResponse(responseCode = "401", description = "Chưa xác thực", content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE))
    public ResponseEntity<PageResponse<NotificationSummaryResponse>> getMyNotifications(
            @RequestParam(name = "unreadOnly", defaultValue = "false") boolean unreadOnly,
            @RequestParam(name = "eventType", required = false) NotificationEventType eventType,
            Pageable pageable) {
        UUID userId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(notificationService.getMyNotifications(userId, unreadOnly, eventType, pageable));
    }

    /**
     * FR-50 — số thông báo chưa đọc, phục vụ badge trên UI.
     * Khai báo TRƯỚC {@code /{id}} để {@code unread-count} không bị hiểu là một UUID.
     */
    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "FR-50 — Đếm số thông báo chưa đọc của tôi (badge UI)")
    @ApiResponse(responseCode = "200", description = "Đếm thành công")
    @ApiResponse(responseCode = "401", description = "Chưa xác thực", content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE))
    public ResponseEntity<Long> countUnread() {
        UUID userId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(notificationService.countUnread(userId));
    }

    /** FR-50 — chi tiết một thông báo; không phải của mình → 403. */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "FR-50 — Xem chi tiết một thông báo của tôi")
    @ApiResponse(responseCode = "200", description = "Lấy chi tiết thành công")
    @ApiResponse(responseCode = "403", description = "Thông báo không thuộc về người gọi", content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE))
    @ApiResponse(responseCode = "404", description = "Không tìm thấy thông báo", content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE))
    public ResponseEntity<NotificationResponse> getMyNotification(@PathVariable("id") UUID id) {
        UUID userId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(notificationService.getMyNotification(userId, id));
    }

    /** FR-51 — đánh dấu một thông báo đã đọc và ghi {@code readAt}. */
    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "FR-51 — Đánh dấu một thông báo là đã đọc")
    @ApiResponse(responseCode = "200", description = "Đánh dấu thành công")
    @ApiResponse(responseCode = "403", description = "Thông báo không thuộc về người gọi", content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE))
    @ApiResponse(responseCode = "404", description = "Không tìm thấy thông báo", content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE))
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable("id") UUID id) {
        UUID userId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(notificationService.markAsRead(userId, id));
    }

    /** FR-51 — đánh dấu tất cả thông báo của chính người gọi là đã đọc (một câu UPDATE hàng loạt). */
    @PatchMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "FR-51 — Đánh dấu tất cả thông báo của tôi là đã đọc")
    @ApiResponse(responseCode = "200", description = "Đánh dấu thành công, trả về số bản ghi đã cập nhật")
    @ApiResponse(responseCode = "401", description = "Chưa xác thực", content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE))
    public ResponseEntity<MarkAllReadResponse> markAllAsRead() {
        UUID userId = SecurityUtils.currentUserId();
        return ResponseEntity.ok(new MarkAllReadResponse(notificationService.markAllAsRead(userId)));
    }
}
