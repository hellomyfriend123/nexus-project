package com.nexus.notification.dto.common;

/**
 * Kết quả đánh dấu tất cả thông báo là đã đọc (FR-51).
 *
 * @param updated số bản ghi thực sự được cập nhật (chỉ tính thông báo của chính người gọi)
 */
public record MarkAllReadResponse(long updated) {
}
