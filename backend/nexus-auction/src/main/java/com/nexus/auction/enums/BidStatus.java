package com.nexus.auction.enums;

/**
 * Kết quả xử lý một lượt đặt giá (FR-30 ghi rõ hai kết quả ACCEPTED / REJECTED).
 *
 * <p>Bid {@code REJECTED} vẫn được lưu lại để phục vụ truy vết/kiểm toán,
 * nhưng KHÔNG xuất hiện trong lịch sử bid công khai (FR-31 chỉ trả bid ACCEPTED).</p>
 */
public enum BidStatus {

    /** Bid hợp lệ, đã trở thành giá cao nhất của phiên. */
    ACCEPTED,

    /** Bid bị từ chối (thấp hơn hoặc bằng {@code currentPrice}). */
    REJECTED
}
