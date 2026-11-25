package com.nexus.auction.enums;

/**
 * Kết quả chốt phiên đấu giá (FR-35).
 *
 * <p>{@code FAILED} để dành cho trường hợp người thắng không hoàn tất giao dịch ở
 * giai đoạn business logic (module commerce) — giai đoạn CRUD này chỉ sinh ra
 * {@code WON} hoặc {@code NO_BIDS}.</p>
 */
public enum SettlementStatus {

    /** Có bid hợp lệ → đã xác định người thắng. */
    WON,

    /** Chưa/không xác định được người thắng. */
    FAILED,

    /** Phiên kết thúc mà không có bid ACCEPTED nào. */
    NO_BIDS
}
