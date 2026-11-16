package com.nexus.notification.enums;

/**
 * Loại sự kiện sinh thông báo — ĐÚNG 23 giá trị theo FR-49 (xem CONVENTIONS §16).
 *
 * <p>Baseline 5.13 chỉ yêu cầu thông báo <b>in-app</b>: mọi giá trị ở đây đều được lưu
 * vào bảng {@code nexus_notification.notifications} và đọc lại qua FR-50.
 * KHÔNG có kênh gửi (EMAIL/PUSH) — cột {@code channel} đã bị loại bỏ theo §11.</p>
 *
 * <p>Mỗi giá trị gắn với một module nghiệp vụ gọi vào
 * {@link com.nexus.notification.service.NotificationService#create}. Thứ tự khai báo
 * giữ nguyên như đặc tả để dễ đối chiếu với tài liệu yêu cầu.</p>
 */
public enum NotificationEventType {

    /** FR-01: tài khoản mới được đăng ký. */
    USER_REGISTERED,

    /** FR-05: Seller tạo sản phẩm. */
    PRODUCT_CREATED,

    /** FR-07: Seller cập nhật sản phẩm. */
    PRODUCT_UPDATED,

    /** FR-16: Buyer thêm sản phẩm vào giỏ. */
    CART_ITEM_ADDED,

    /** FR-17: Buyer cập nhật số lượng sản phẩm trong giỏ. */
    CART_ITEM_UPDATED,

    /** FR-18: Buyer xoá sản phẩm khỏi giỏ. */
    CART_ITEM_REMOVED,

    /** FR-19/FR-22: đơn hàng được tạo từ checkout. */
    ORDER_CREATED,

    /** FR-21: thanh toán đơn hàng thành công. */
    ORDER_PAID,

    /** FR-21: thanh toán đơn hàng thất bại. */
    ORDER_PAYMENT_FAILED,

    /** FR-24: đơn hàng hoàn tất. */
    ORDER_COMPLETED,

    /** FR-25: đơn hàng bị huỷ. */
    ORDER_CANCELLED,

    /** FR-26: Seller tạo phiên đấu giá. */
    AUCTION_CREATED,

    /** FR-33: phiên đấu giá bắt đầu. */
    AUCTION_STARTED,

    /** FR-30: có lượt đặt giá mới trong phiên. */
    BID_PLACED,

    /** FR-32: người dùng bị trả giá cao hơn (outbid). */
    OUTBID,

    /** FR-37: phiên đấu giá bị huỷ. */
    AUCTION_CANCELLED,

    /** FR-34: phiên đấu giá kết thúc. */
    AUCTION_ENDED,

    /** FR-35: người dùng thắng phiên đấu giá. */
    AUCTION_WON,

    /** FR-35: phiên đấu giá không có người thắng hoặc giao dịch thất bại. */
    AUCTION_FAILED,

    /** FR-38: vận đơn được tạo cho đơn hàng. */
    SHIPMENT_CREATED,

    /** FR-39: vận đơn đã giao thành công. */
    SHIPMENT_DELIVERED,

    /** FR-41/FR-43: Seller nhận được đánh giá từ Buyer. */
    REVIEW_RECEIVED,

    /** Thông báo hệ thống do Administrator phát đi cho toàn bộ hoặc một nhóm người dùng. */
    SYSTEM_ANNOUNCEMENT
}
