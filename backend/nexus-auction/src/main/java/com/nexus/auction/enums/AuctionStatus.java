package com.nexus.auction.enums;

/**
 * Trạng thái vòng đời của một phiên đấu giá (FR-26 → FR-37).
 *
 * <p>Luồng chuyển trạng thái hợp lệ:
 * {@code SCHEDULED → ACTIVE → ENDED} hoặc {@code SCHEDULED/ACTIVE → CANCELLED}
 * (do Seller/Admin chủ động hủy — FR-37).</p>
 */
public enum AuctionStatus {

    /** Đã tạo, chờ tới {@code startTime} (FR-26). */
    SCHEDULED,

    /** Đang diễn ra, chỉ lúc này mới nhận bid (FR-30, FR-33). */
    ACTIVE,

    /** Đã hết thời gian, chờ/đã chốt người thắng (FR-34, FR-35). */
    ENDED,

    /** Bị Seller hoặc Admin hủy trước khi kết thúc (FR-37). */
    CANCELLED
}
